#!/usr/bin/env node
if (require.main === module) {
  require("../index.js");
} else {
  console.log(
    "Run with `sitemap-to-html --sitemap path/to/sitemap.xml --output path/to/htmls`"
  );
  process.exit(1);
}
