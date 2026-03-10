import { chromium, type Browser, type Page, type BrowserContext } from "playwright-core";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

let browser: Browser | null = null;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--no-zygote",
];

// Find Chromium binary: env var, system install (Alpine/Debian), or Playwright default
function findChromium(): string | undefined {
  // Check env var first (can be set via App Config Service)
  const envPath = process.env.CHROMIUM_PATH;
  if (envPath && existsSync(envPath)) {
    console.log(`[crawler] Using CHROMIUM_PATH env: ${envPath}`);
    return envPath;
  } else if (envPath) {
    console.warn(`[crawler] CHROMIUM_PATH set to "${envPath}" but file does not exist`);
  }

  const candidates = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/lib/chromium/chromium",
    "/usr/lib/chromium-browser/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome-unstable",
    "/snap/bin/chromium",
    "/opt/chromium/chrome",
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      console.log(`[crawler] Found Chromium at: ${path}`);
      return path;
    }
  }
  // Try `which chromium` as last resort
  try {
    const result = execSync(
      "which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null",
      { encoding: "utf8" }
    ).trim();
    if (result && existsSync(result)) {
      console.log(`[crawler] Found Chromium via which: ${result}`);
      return result;
    }
  } catch {
    // ignore
  }
  console.warn("[crawler] No system Chromium found — set CHROMIUM_PATH env var or install chromium via apk/apt");
  return undefined;
}

/**
 * Attempt to install Chromium at runtime (last resort).
 * Only works if apk/apt is available and user has permissions.
 */
function tryRuntimeInstall(): string | undefined {
  console.log("[crawler] Attempting runtime Chromium install...");

  // Alpine
  if (existsSync("/etc/alpine-release")) {
    try {
      const ver = execSync("cat /etc/alpine-release", { encoding: "utf8" }).trim().split(".").slice(0, 2).join(".");
      const repo = `https://dl-cdn.alpinelinux.org/alpine/v${ver}/community`;
      console.log(`[crawler] Alpine ${ver} detected, trying apk add with community repo...`);
      execSync(
        `apk add --no-cache --repository=${repo} chromium nss freetype harfbuzz ca-certificates ttf-freefont 2>&1`,
        { encoding: "utf8", timeout: 120000 }
      );
      const path = findChromium();
      if (path) return path;
    } catch (err) {
      console.warn(`[crawler] Runtime apk install failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Playwright-core install (works on glibc systems like Ubuntu/Debian)
  try {
    console.log("[crawler] Trying npx playwright-core install chromium...");
    execSync("npx playwright-core install chromium 2>&1", {
      encoding: "utf8",
      timeout: 120000,
    });
    console.log("[crawler] playwright-core install completed");
    return undefined; // Let playwright-core use its default path
  } catch (err) {
    console.warn(`[crawler] playwright-core install failed: ${err instanceof Error ? err.message : err}`);
  }

  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    let executablePath = findChromium();

    // First attempt
    try {
      browser = await chromium.launch({
        ...(executablePath ? { executablePath } : {}),
        headless: true,
        args: LAUNCH_ARGS,
      });
      console.log(`[crawler] Browser launched successfully${executablePath ? ` (${executablePath})` : ""}`);
      return browser;
    } catch (firstErr) {
      console.warn(`[crawler] First launch attempt failed: ${firstErr instanceof Error ? firstErr.message.slice(0, 120) : firstErr}`);
    }

    // Try runtime install and retry
    executablePath = tryRuntimeInstall();
    browser = await chromium.launch({
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      args: LAUNCH_ARGS,
    });
    console.log(`[crawler] Browser launched after runtime install${executablePath ? ` (${executablePath})` : ""}`);
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
  const timeout = Math.min(options.timeout ?? 45000, 120000);
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
  await page.waitForTimeout(2000);

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
