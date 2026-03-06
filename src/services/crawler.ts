import { chromium, type Browser, type Page, type BrowserContext } from "playwright-core";
import { existsSync } from "node:fs";

let browser: Browser | null = null;

// Find Chromium binary: system install (Alpine) or Playwright default
function findChromium(): string | undefined {
  const candidates = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    const executablePath = findChromium();
    browser = await chromium.launch({
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--no-zygote",
      ],
    });
  }
  return browser;
}

export interface CrawlResult {
  page: Page;
  context: BrowserContext;
  url: string;
  title: string;
}

export interface CrawlOptions {
  waitForSelector?: string;
  timeout?: number;
}

/**
 * Crawl a URL using Playwright headless Chromium.
 * Returns the Page (still open) for further analysis — caller must close the context.
 */
export async function crawlPage(
  url: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const timeout = Math.min(options.timeout ?? 30000, 120000);
  const instance = await getBrowser();

  const context = await instance.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(timeout);

  // Use "domcontentloaded" instead of "networkidle" because streaming sites
  // keep connections open for video streams and never reach network idle.
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout,
  });

  // Give JS-heavy players time to initialize
  await page.waitForTimeout(3000);

  // If a specific selector was requested, wait for it
  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout });
  }

  const title = await page.title();

  return { page, context, url, title };
}

/**
 * Extract internal links from the current page (same origin only).
 */
export async function extractInternalLinks(
  page: Page,
  baseUrl: string,
  maxLinks: number = 10
): Promise<string[]> {
  const origin = new URL(baseUrl).origin;
  const links: string[] = await page.evaluate(
    ({ origin, max }) => {
      const anchors = Array.from(document.querySelectorAll("a[href]"));
      const seen = new Set<string>();
      const result: string[] = [];
      for (const a of anchors) {
        if (result.length >= max) break;
        try {
          const url = new URL((a as HTMLAnchorElement).href);
          // Same origin, no hash-only links, no javascript:
          if (
            url.origin === origin &&
            url.protocol.startsWith("http") &&
            !seen.has(url.pathname)
          ) {
            seen.add(url.pathname);
            result.push(url.href);
          }
        } catch {
          // skip invalid URLs
        }
      }
      return result;
    },
    { origin, max: maxLinks }
  );
  return links;
}

/**
 * Capture a screenshot of a specific element by CSS selector.
 * Returns a base64 data URI or undefined if the element can't be captured.
 */
export async function screenshotElement(
  page: Page,
  selector: string
): Promise<string | undefined> {
  try {
    const element = await page.$(selector);
    if (!element) return undefined;
    const box = await element.boundingBox();
    if (!box || box.width === 0 || box.height === 0) return undefined;
    const buffer = await element.screenshot({ type: "jpeg", quality: 70 });
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/**
 * Close the browser instance (for graceful shutdown).
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
