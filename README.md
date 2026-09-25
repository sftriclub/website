# website

The SF Tri Club website, built with [Hugo](https://gohugo.io/).

## Editing content

Admins edit the site at [sftriclub.org/admin](https://sftriclub.org/admin/) using [Sveltia CMS](https://sveltiacms.app/). See [docs/editing-the-website.md](docs/editing-the-website.md) for the admin guide.

For developers:

- `static/admin/config.yml` defines the editing forms. Every front matter key a page uses must be listed there (use `widget: hidden` for ones admins shouldn't touch), or it may be dropped when an admin saves.
- `static/admin/editor-components.js` turns the shortcodes in `layouts/shortcodes/` into visual blocks in the editor. If you change a shortcode's parameters, update its block too.
- To try the CMS locally, run `mise run dev`, open http://localhost:1313/admin/ in Chrome or Edge, and choose "Work with Local Repository".
