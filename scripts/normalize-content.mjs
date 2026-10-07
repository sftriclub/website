// Rewrites CMS-managed content into exactly the format Sveltia CMS saves, so
// a CMS save only shows the edit that was made, not a reformat of the file.
//
//   node scripts/normalize-content.mjs           rewrite files in place
//   node scripts/normalize-content.mjs --check   list files that would change, exit 1 if any
//
// The rules mirror Sveltia's own save logic (checked against v0.230.0):
// fields are written in the order static/admin/config.yml defines them, with
// the `output` options from that config; empty optional fields are dropped,
// a missing checkbox is written as false, and text values are trimmed. YAML
// comments are not kept, because the CMS drops them too.
//
// Anything the CMS would silently delete on save (a key with no matching
// field, or page body text with no body field) is reported as an error and
// the file is left untouched; add the field to config.yml first. So is a
// required field that the content leaves empty, because the CMS would refuse
// to save that entry until someone fills it in.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import YAML from 'yaml';

const root = resolve(import.meta.dirname, '..');
const check = process.argv.includes('--check');
const config = YAML.parse(readFileSync(join(root, 'static/admin/config.yml'), 'utf8'));

const { omit_empty_optional_fields: omitEmpty = false, yaml: yamlOutput = {} } = config.output ?? {};
const { indent_size: indent = 2, indent_sequences: indentSeq = true, quote = 'none' } = yamlOutput;
// Same options Sveltia passes to Document#toString.
const toStringOptions = {
  indent,
  indentSeq,
  lineWidth: 0,
  defaultKeyType: 'PLAIN',
  defaultStringType: quote === 'double' ? 'QUOTE_DOUBLE' : quote === 'single' ? 'QUOTE_SINGLE' : 'PLAIN',
  singleQuote: quote !== 'double',
};

// Sveltia treats null, "", [] and {} as empty (false and 0 are kept).
const isEmpty = (v) =>
  v == null || v === '' || (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

function normalizeObject(data, fields, where, errors) {
  const out = {};
  const known = new Set(fields.map((f) => f.name));
  for (const key of Object.keys(data ?? {})) {
    if (!known.has(key)) errors.push(`${where}: "${key}" has no CMS field, so a CMS save would delete it`);
  }
  for (const field of fields) {
    let value = normalizeValue(data?.[field.name], field, `${where}.${field.name}`, errors);
    if (value === undefined && field.widget === 'hidden' && field.default !== undefined) value = field.default;
    const optional = field.required === false;
    if (!optional && isEmpty(value) && field.widget !== 'hidden') {
      errors.push(`${where}: required field "${field.name}" is empty, so the CMS would refuse to save this entry (add required: false if it's optional)`);
    }
    if (isEmpty(value) && (optional && omitEmpty)) continue;
    if (value === undefined) continue;
    out[field.name] = value;
  }
  return out;
}

function normalizeValue(value, field, where, errors) {
  switch (field.widget) {
    case 'list':
      if (value == null) return [];
      if (!Array.isArray(value)) return value;
      if (field.fields) return value.map((item, i) => normalizeObject(item, field.fields, `${where}[${i}]`, errors));
      return value.map((item) => (typeof item === 'string' ? item.trim() : item));
    case 'object':
      return isPlainObject(value) ? normalizeObject(value, field.fields ?? [], where, errors) : value;
    case 'boolean':
      return value ?? field.default ?? false;
    case 'number':
      return value;
    default:
      return typeof value === 'string' ? value.trim() : value;
  }
}

function serializeYaml(data) {
  return new YAML.Document(data).toString(toStringOptions).trim();
}

function normalizeMarkdown(text, fields, where, errors) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const frontMatter = match ? YAML.parse(match[1]) ?? {} : {};
  const body = (match ? match[2] : text).trim();
  const bodyField = fields.find((f) => f.name === 'body');
  if (body && !bodyField) errors.push(`${where}: has page text but no "body" field, so a CMS save would delete it`);
  if ('body' in frontMatter) errors.push(`${where}: front matter key "body" clashes with the page text field`);
  const data = normalizeObject(frontMatter, fields.filter((f) => f.name !== 'body'), where, errors);
  if (Object.keys(data).length === 0) return `${body}\n`;
  return `---\n${serializeYaml(data)}\n---\n${body ? `\n${body}\n` : ''}`;
}

function normalizeData(text, fields, where, errors) {
  return `${serializeYaml(normalizeObject(YAML.parse(text) ?? {}, fields, where, errors))}\n`;
}

// Every file the CMS manages, with the fields it edits them through.
const entries = [];
for (const collection of config.collections) {
  if (collection.files) {
    for (const file of collection.files) entries.push({ path: file.file, fields: file.fields });
  } else if (collection.folder) {
    const extension = collection.extension ?? 'md';
    for (const name of readdirSync(join(root, collection.folder)).sort()) {
      if (name.endsWith(`.${extension}`) && name !== `_index.${extension}`) {
        entries.push({ path: join(collection.folder, name), fields: collection.fields });
      }
    }
  }
}

const changed = [];
const failed = [];
for (const { path, fields } of entries) {
  const absolute = join(root, path);
  const original = readFileSync(absolute, 'utf8');
  const errors = [];
  const normalized = path.endsWith('.md')
    ? normalizeMarkdown(original, fields, path, errors)
    : normalizeData(original, fields, path, errors);
  if (errors.length) {
    failed.push(...errors);
    continue;
  }
  if (normalized !== original) {
    changed.push(relative(root, absolute));
    if (!check) writeFileSync(absolute, normalized);
  }
}

for (const error of failed) console.error(`error: ${error}`);
if (changed.length) {
  console.log(`${check ? 'Not in CMS format' : 'Normalized'} (${changed.length}):`);
  for (const path of changed) console.log(`  ${path}`);
  if (check) console.log('Run `mise run normalize` to fix.');
} else if (!failed.length) {
  console.log(`All ${entries.length} CMS-managed files are already in CMS format.`);
}
process.exit(failed.length || (check && changed.length) ? 1 : 0);
