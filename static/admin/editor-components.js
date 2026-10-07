// Custom editor components for Sveltia CMS. Loaded after sveltia-cms.js, so
// the global CMS object exists. Each component turns a Hugo shortcode into a
// form in the rich-text editor; `pattern` must match how the shortcode is
// written in content/, and `toBlock` must write it back the same way.

// Quote characters would end the shortcode parameter early, and newlines
// would split it, so keep parameter values to a single line of plain text.
const shortcodeParam = (value = '') => String(value).replace(/"/g, "'").replace(/\s*\n\s*/g, ' ').trim();

const imageSection = {
  id: 'image-section',
  label: 'Photo + Text Section',
  icon: 'vertical_split',
  fields: [
    { name: 'src', label: 'Photo', widget: 'image' },
    {
      name: 'alt',
      label: 'Photo Alt Text',
      widget: 'string',
      required: false,
      hint: 'Describes the photo for screen readers and image search, e.g. "Club members cheering at the Escape from Alcatraz finish". Leave blank only if the photo is purely decorative.',
    },
    {
      name: 'side',
      label: 'Photo Side',
      widget: 'select',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
      default: 'right',
    },
    { name: 'body', label: 'Text', widget: 'richtext' },
  ],
  // {{< image-section src="…" alt="…" side="…" >}} … {{< /image-section >}}
  // See layouts/shortcodes/image-section.html.
  pattern:
    /^\{\{< image-section src="(?<src>[^"]*)"(?: alt="(?<alt>[^"]*)")?(?: side="(?<side>left|right)")? >\}\}\n(?<body>[\s\S]*?)\n\{\{< \/image-section >\}\}/m,
  fromBlock: ({ groups: { src = '', alt = '', side = 'right', body = '' } = {} }) => ({ src, alt, side, body }),
  toBlock: ({ src = '', alt = '', side = 'right', body = '' }) =>
    `{{< image-section src="${shortcodeParam(src)}" alt="${shortcodeParam(alt)}" side="${side === 'left' ? 'left' : 'right'}" >}}\n${String(body).trim()}\n{{< /image-section >}}`,
  toPreview: ({ src = '', alt = '', body = '' }) => `![${alt}](${src})\n\n${body}`,
};

if (typeof CMS !== 'undefined') {
  CMS.registerEditorComponent(imageSection);
}

if (typeof module !== 'undefined') {
  module.exports = { imageSection, shortcodeParam };
}
