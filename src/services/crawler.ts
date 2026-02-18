import { chromium, type Browser, type Page, type BrowserContext } from "playwright";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
 * Close the browser instance (for graceful shutdown).
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
