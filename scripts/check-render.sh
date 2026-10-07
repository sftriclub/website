#!/usr/bin/env bash
# Builds the site from a base git ref and from the working tree, then diffs
# the generated pages. Formatting-only content changes (quote style, field
# order, a CMS save that only reformats) must produce no diff; anything that
# changes what visitors see shows up here.
#
#   scripts/check-render.sh            compare against origin/main
#   scripts/check-render.sh <ref>      compare against another ref
#
# Exits 1 when the rendered output differs.
set -euo pipefail

base="${1:-origin/main}"
root="$(git rev-parse --show-toplevel)"
work="$(mktemp -d "${TMPDIR:-/tmp}/check-render.XXXXXX")"
trap 'rm -rf "$work"' EXIT

mkdir -p "$work/base-src"
git -C "$root" archive "$base" | tar -x -C "$work/base-src"

echo "Building $base..."
hugo --source "$work/base-src" --destination "$work/base" --quiet
echo "Building working tree..."
hugo --source "$root" --destination "$work/head" --quiet

# Compare the text the site serves; resized image variants are named by
# content hash, so any real image change also shows up as a changed page.
pattern='*.html *.xml *.txt *.json *.js *.css _headers _redirects'
list() { (cd "$1" && for p in $pattern; do find . -type f -name "$p"; done | sort); }

if diff -q <(list "$work/base") <(list "$work/head") >/dev/null &&
   (cd "$work/base" && list . | while read -r f; do cmp -s "$f" "$work/head/$f" || exit 1; done); then
  echo "No rendered changes against $base."
  exit 0
fi

echo "Rendered output differs from $base:"
diff -ru \
  --exclude='*.webp' --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.png' --exclude='*.gif' --exclude='*.svg' --exclude='*.ico' --exclude='*.yml' \
  "$work/base" "$work/head" | sed "s#$work/##g" || true
exit 1
