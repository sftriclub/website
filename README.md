# San Francisco Triathlon Club website

The source for [sftriclub.org](https://sftriclub.org), the website of the San Francisco Triathlon Club, a multi-sport club and 501(c)(3) nonprofit in San Francisco.

The site is built with [Hugo](https://gohugo.io/) and hosted on Cloudflare. Page content lives in `content/` as Markdown, board members and sponsors in `data/`, and photos in `static/images/`. Changes merged to `main` go live a few minutes later.

Every change to `main` goes through a pull request and needs an approving review from another board member, whether it's made in the browser or locally.

## Editing in the browser (board members)

Board members with access to this GitHub repository can edit the site without any setup:

1. Go to [sftriclub.org/admin](https://sftriclub.org/admin/) and click **Sign In with GitHub**.
2. Pick a section in the left sidebar (Pages, Training Programs, About, and so on), then the page to change.
3. Edit on the left; the right side shows a preview.
4. Click **Save**. This saves a draft to its own branch (`cms/<section>/<page>`) and opens a pull request. Saving again updates the same pull request. Nothing changes on the live site yet.
5. When it's ready, set the status to **In Review** and ask another board member to review the pull request on GitHub.
6. Once it's approved, set the status to **Ready** and click **Publish** (or click **Merge** on GitHub). The change goes live a few minutes later.

No GitHub account or access yet? Create a free account at [github.com](https://github.com/signup) and send your username to the board member who manages the website.

## Editing locally

You'll need [mise](https://mise.jdx.dev/), which installs the right versions of Hugo and Node from `mise.toml`.

```sh
git clone https://github.com/sftriclub/website.git
cd website
mise install
mise run dev
```

This serves the site at http://localhost:1313 with live reload. The editor from `/admin` also works locally: open http://localhost:1313/admin/ in Chrome, Edge or Brave, click **Work with Local Repository** and pick this folder. It edits the files in your clone directly, with no sign-in and no pull request.

To propose a change, commit it on a branch and open a pull request against `main`. It can be merged once another board member approves it.

### Useful tasks

| Command | What it does |
| --- | --- |
| `mise run dev` | Start the dev server for the site and the editor |
| `mise run build` | Build the production site into `public/` |
| `mise run new -- news/my-post.md` | Create a new content file |
| `mise run normalize` | Rewrite hand-edited content into the format the editor saves |
| `mise run check-format` | Fail if content isn't in the format the editor saves |
| `mise run check-render` | Show how a change affects the built site compared with `origin/main` |

If you hand-edit Markdown, run `mise run normalize` before committing so a later save from the editor only shows real changes.

## Contact form

The contact form posts to a small Cloudflare Worker in `workers/contact-form/` that emails `info@sftriclub.org` through Resend. Its API key is stored as a Cloudflare secret and is never committed.
