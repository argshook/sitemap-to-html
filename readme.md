# Sitemap to HTML

This project is a command line utility that generates HTML snapshots
from given `sitemap.xml` file.

Useful for pre-generating HTML files for website crawlers that do not
run javascript.

Just in case you need a quick win and you don't want to rewrite whole
stack to be server-side rendered :)

## Usage

* `npm install sitemap-to-html --save-dev`
* `sitemap-to-html --sitemap sitemap.xml --output build`

provide a regular `sitemap.xml` file and `output` path.

The tool will:
1. visit link found in `sitemap.xml` with puppeteer
1. wait for page to fully load (no network requests for at least 300ms)
1. create HTML snapshot of loaded page
1. save it in folder provided in `--output` flag (it is `build` folder by default)
1. goto `1`, until all links visited

> In case of nested links, for example `website.com/home/page/hello`, the
output will be saved in `build/home/page/hello.html`
