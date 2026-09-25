/*
  Visual blocks for the page layouts that live inside page bodies.

  Each Hugo shortcode in layouts/shortcodes/ gets a block here so admins see
  a form (photo picker, headings, text) instead of raw {{< ... >}} code. The
  blocks show up under the editor's Insert menu.

  `pattern` reads the shortcode out of the Markdown, `toBlock` writes it back.
  toBlock must reproduce the exact format the templates expect, so if you
  change a shortcode's parameters, update its block here too.

  Previews reuse the site's own class names, so they pick up /css/main.css.
*/

// Shortcode parameters are double-quoted, so a stray " would end the value
// early and break the page. Swap it for a curly quote, which looks the same.
const attr = (value) => String(value ?? '').replace(/"/g, '”').trim();
const body = (value) => String(value ?? '').trim();

CMS.registerEditorComponent({
  id: 'image-section',
  label: 'Photo next to text',
  icon: 'view_sidebar',
  fields: [
    { name: 'src', label: 'Photo', widget: 'image' },
    {
      name: 'alt',
      label: 'Photo description',
      widget: 'string',
      required: false,
      hint: 'Describe the photo for people using screen readers, e.g. "Club members cheering at a race".',
    },
    {
      name: 'side',
      label: 'Photo goes on the',
      widget: 'select',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
      default: 'right',
    },
    { name: 'content', label: 'Text', widget: 'richtext' },
  ],
  pattern:
    /^{{< image-section src="(?<src>[^"]*)" alt="(?<alt>[^"]*)" side="(?<side>left|right)" >}}\n(?<content>[\s\S]*?)\n{{< \/image-section >}}/m,
  toBlock: ({ src, alt, side = 'right', content }) =>
    `{{< image-section src="${attr(src)}" alt="${attr(alt)}" side="${side || 'right'}" >}}\n${body(content)}\n{{< /image-section >}}`,
  toPreview: ({ src = '', alt = '', side = 'right', content = '' }) =>
    `<div class="image-section image-section--${side || 'right'}">` +
    `<div class="image-section__content">\n\n${body(content)}\n\n</div>` +
    `<div class="image-section__image">${src ? `<img src="${src}" alt="${attr(alt)}">` : ''}</div>` +
    `</div>`,
});

CMS.registerEditorComponent({
  id: 'notice',
  label: 'Highlighted notice',
  icon: 'campaign',
  fields: [
    { name: 'title', label: 'Title', widget: 'string', required: false },
    { name: 'content', label: 'Text', widget: 'richtext' },
  ],
  pattern:
    /^{{< notice(?: title="(?<title>[^"]*)")? >}}\n(?<content>[\s\S]*?)\n{{< \/notice >}}/m,
  toBlock: ({ title, content }) =>
    `{{< notice${attr(title) ? ` title="${attr(title)}"` : ''} >}}\n${body(content)}\n{{< /notice >}}`,
  toPreview: ({ title = '', content = '' }) =>
    `<div class="notice-box">` +
    (title ? `<div class="notice-box__title">${attr(title)}</div>` : '') +
    `\n\n${body(content)}\n\n</div>`,
});

const FAQ_ITEM = /{{< faq-item q="([^"]*)" >}}\n([\s\S]*?)\n{{< \/faq-item >}}/g;

CMS.registerEditorComponent({
  id: 'faq',
  label: 'Questions and answers',
  icon: 'quiz',
  fields: [
    {
      name: 'items',
      label: 'Questions',
      label_singular: 'Question',
      widget: 'list',
      fields: [
        { name: 'q', label: 'Question', widget: 'string' },
        { name: 'a', label: 'Answer', widget: 'richtext' },
      ],
    },
  ],
  pattern: /^{{< faq >}}\n(?<inner>[\s\S]*?)\n{{< \/faq >}}/m,
  fromBlock: ({ groups: { inner = '' } = {} }) => ({
    items: [...inner.matchAll(FAQ_ITEM)].map(([, q, a]) => ({ q, a: a.trim() })),
  }),
  toBlock: ({ items = [] }) =>
    `{{< faq >}}\n\n` +
    items
      .map(({ q, a }) => `{{< faq-item q="${attr(q)}" >}}\n${body(a)}\n{{< /faq-item >}}\n\n`)
      .join('') +
    `{{< /faq >}}`,
  toPreview: ({ items = [] }) =>
    `<div class="faq">` +
    items
      .map(
        ({ q = '', a = '' }) =>
          `<details class="faq-item" open><summary class="faq-question">${attr(q)}</summary>` +
          `<div class="faq-answer">\n\n${body(a)}\n\n</div></details>`,
      )
      .join('') +
    `</div>`,
});

const COLUMN = /{{< column >}}\n([\s\S]*?)\n{{< \/column >}}/g;

CMS.registerEditorComponent({
  id: 'columns',
  label: 'Side-by-side boxes',
  icon: 'view_column',
  fields: [
    {
      name: 'columns',
      label: 'Boxes',
      label_singular: 'Box',
      widget: 'list',
      hint: 'Up to 4 boxes fit in a row. They stack on phones.',
      fields: [{ name: 'content', label: 'Text', widget: 'richtext' }],
    },
  ],
  pattern: /^{{< columns >}}\n(?<inner>[\s\S]*?)\n{{< \/columns >}}/m,
  fromBlock: ({ groups: { inner = '' } = {} }) => ({
    columns: [...inner.matchAll(COLUMN)].map(([, content]) => ({ content: content.trim() })),
  }),
  toBlock: ({ columns = [] }) =>
    `{{< columns >}}\n` +
    columns.map(({ content }) => `{{< column >}}\n${body(content)}\n{{< /column >}}\n`).join('') +
    `{{< /columns >}}`,
  toPreview: ({ columns = [] }) =>
    `<div class="columns">` +
    columns.map(({ content = '' }) => `<div class="column">\n\n${body(content)}\n\n</div>`).join('') +
    `</div>`,
});

// Make the preview pane look like the live site.
CMS.registerPreviewStyle(
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Inter:wght@400;500;600;700&family=Yellowtail&display=swap',
);
CMS.registerPreviewStyle('/css/main.css');
CMS.registerPreviewStyle(
  `
  /* The site scopes its prose styles to .page-body, which the preview pane
     doesn't have, so the key ones are repeated here. */
  body { padding: 1.5rem; }
  h2 { font-size: 1.75rem; margin-top: 2rem; margin-bottom: 0.75rem; }
  h3 { font-size: 1.3125rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  p { margin-bottom: 1rem; }
  ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 1rem; }
  ol { list-style: decimal; padding-left: 1.25rem; margin-bottom: 1rem; }
  a { text-decoration: underline; text-decoration-color: var(--color-accent); text-decoration-thickness: 2px; }
  img { max-width: 100%; border-radius: var(--radius-md); }
  .image-section__content > :first-child { margin-top: 0; }
  `,
  { raw: true },
);
