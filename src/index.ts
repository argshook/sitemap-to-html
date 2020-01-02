import path from "path";
import { promises as fs } from "fs";
import minimist from "minimist";
import { xml2json } from "xml2json-light";
import Url from "url-parse";
import puppeteer from "puppeteer";
import { URLParse } from "./typings/url-parse";

const cwd = process.cwd();
const log = (s: string) => process.stdout.write(`${s} `);
log.line = console.log;
log.dot = () => process.stdout.write(".");
log.ok = () => process.stdout.write(" OK\n");
log.fail = (s: string) => process.stdout.write(` ERROR\n${s}`);

const extractUrlsFromSitemap = async (sitemapPath: string) => {
  const sitemapXml = await fs.readFile(sitemapPath, "utf8");
  const sitemapJson = xml2json(sitemapXml);
  const uniqueUrls = new Set();

  const urls = sitemapJson.urlset.url;
  if (Array.isArray(urls)) {
    sitemapJson.urlset.url.forEach(({ loc }: { loc: string }) =>
      uniqueUrls.add(loc)
    );
  } else {
    uniqueUrls.add(urls.loc);
  }

  return uniqueUrls;
};

interface UrlsByHostname {
  [hostname: string]: Set<URLParse>;
}

const run = async ({
  sitemapPath,
  relativeSitemapPath,
  outputPath
}: {
  sitemapPath: string;
  relativeSitemapPath: string;
  outputPath: string;
}) => {
  log.line("Welcome to sitemap-to-html!");
  log(`Parsing ${relativeSitemapPath}`);
  log.dot();

  // TODO: handle failure
  const urls = await extractUrlsFromSitemap(sitemapPath);
  log.ok();

  log(`Categorizing URLs from ${relativeSitemapPath}`);

  const urlsByHostname: UrlsByHostname = Array.from(urls).reduce(
    (acc: UrlsByHostname, url) => {
      // TODO: handle failure
      const parsedUrl: URLParse = new Url(url as string);
      log.dot();

      acc[parsedUrl.hostname] =
        typeof acc[parsedUrl.hostname] === "undefined"
          ? (new Set().add(parsedUrl) as Set<URLParse>)
          : acc[parsedUrl.hostname].add(parsedUrl);
      return acc;
    },
    {}
  );

  log.ok();

  const hostnames = Object.keys(urlsByHostname);
  log.line(`Found ${hostnames.length} hostnames: ${hostnames.join(", ")}`);

  log.line("Opening Puppeteer");

  const { page, browser } = await runPuppeteer();

  for await (const [hostname, urls] of Object.entries(urlsByHostname)) {
    log.line(`Starting to snapshot ${urls.size} pages at ${hostname} hostname`);

    for await (const url of urls) {
      log(`Snapshotting ${url.href}`);

      // TODO: handle failure
      await page.goto(url.href, { waitUntil: "networkidle0" });
      log.dot();

      const html = await page.content();
      log.dot();

      log(" Saving HTML");

      const [match, filename = "index"] =
        url.pathname.match(/\/([^\/]*)$/) || [];
      const pathnameWithoutFilename = url.pathname.replace(match, "");

      // TODO: handle failure
      await fs.mkdir(path.join(outputPath, hostname, pathnameWithoutFilename), {
        recursive: true
      });
      log.dot();

      // TODO: handle failure
      await fs.writeFile(
        path.join(
          outputPath,
          hostname,
          pathnameWithoutFilename,
          `${filename}.html`
        ),
        html,
        { encoding: "utf8" }
      );
      log.dot();

      log.ok();
    }
  }

  log("Closing puppeteer");
  await browser.close();
  log.dot();
  log.ok();

  log.line("Thanks, see you later!");
  log.line();
  log.line(`Done! Find HTMLs at ${outputPath}`);
};

const runPuppeteer = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  return { browser, page };
};

(async () => {
  const { sitemap = "sitemap.xml", output = "build" } = minimist(
    process.argv.slice(2)
  );

  const sitemapPath = path.resolve(cwd, sitemap);
  const outputPath = path.resolve(cwd, output);

  await run({
    sitemapPath,
    relativeSitemapPath: sitemap,
    outputPath
  });
})();
