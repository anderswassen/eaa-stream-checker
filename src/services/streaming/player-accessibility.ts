import type { Page } from 'playwright-core';
import type {
  PlayerAccessibilityResult,
  KeyboardNavigationResult,
  AriaLabelResult,
  AriaButtonInfo,
  FocusIndicatorResult,
  CaptionCustomizationResult,
  ContrastResult,
  TouchTargetResult,
  DetectedPlayer,
} from './types.js';

async function checkKeyboardNavigation(
  page: Page,
  player: DetectedPlayer
): Promise<KeyboardNavigationResult> {
  const containerSelector = player.containerSelector;

  return page.evaluate(async (selector) => {
    const result: {
      canTabIntoPlayer: boolean;
      reachableControls: string[];
      unreachableControls: string[];
      tabStopsToPlay: number;
      tabStopsToCaptions: number;
      tabStopsToAD: number;
      controlsActivatableWithKeyboard: boolean;
    } = {
      canTabIntoPlayer: false,
      reachableControls: [],
      unreachableControls: [],
      tabStopsToPlay: -1,
      tabStopsToCaptions: -1,
      tabStopsToAD: -1,
      controlsActivatableWithKeyboard: false,
    };

    const container = document.querySelector(selector);
    if (!container) return result;

    // Find all interactive elements within the player
    const interactiveSelectors = [
      'button',
      '[role="button"]',
      'input[type="range"]',
      '[tabindex]',
      'a[href]',
      '[role="slider"]',
      '[role="menuitem"]',
    ];
    const interactiveElements = container.querySelectorAll(
      interactiveSelectors.join(', ')
    );

    // Check which elements are focusable (tabindex >= 0 or naturally focusable)
    const focusableElements: Element[] = [];
    const unfocusableElements: Element[] = [];

    for (const el of interactiveElements) {
      const tabIndex = (el as HTMLElement).tabIndex;
      const isHidden =
        (el as HTMLElement).offsetParent === null &&
        getComputedStyle(el).position !== 'fixed';

      if (tabIndex >= 0 && !isHidden) {
        focusableElements.push(el);
      } else if (!isHidden) {
        unfocusableElements.push(el);
      }
    }

    result.canTabIntoPlayer = focusableElements.length > 0;

    // Categorize controls
    const playPatterns = /play|pause/i;
    const captionPatterns = /caption|subtitle|cc|closed.?caption/i;
    const adPatterns = /audio.?desc|described|^ad$/i;
    const volumePatterns = /volume|mute|sound/i;
    const fullscreenPatterns = /fullscreen|full.?screen|expand/i;
    const seekPatterns = /seek|timeline|progress|scrub/i;

    let tabIndex = 0;
    for (const el of focusableElements) {
      tabIndex++;
      const text = (
        (el as HTMLElement).textContent || ''
      ).trim();
      const ariaLabel = el.getAttribute('aria-label') || '';
      const title = el.getAttribute('title') || '';
      const className = el.className || '';
      const combined = `${text} ${ariaLabel} ${title} ${className}`;

      let controlName = combined.slice(0, 50) || el.tagName.toLowerCase();

      if (playPatterns.test(combined)) {
        result.tabStopsToPlay = tabIndex;
        controlName = 'play/pause';
      } else if (captionPatterns.test(combined)) {
        result.tabStopsToCaptions = tabIndex;
        controlName = 'captions toggle';
      } else if (adPatterns.test(combined)) {
        result.tabStopsToAD = tabIndex;
        controlName = 'audio description';
      } else if (volumePatterns.test(combined)) {
        controlName = 'volume';
      } else if (fullscreenPatterns.test(combined)) {
        controlName = 'fullscreen';
      } else if (seekPatterns.test(combined)) {
        controlName = 'timeline/seek';
      }

      result.reachableControls.push(controlName);
    }

    for (const el of unfocusableElements) {
      const ariaLabel = el.getAttribute('aria-label') || '';
      const text = ((el as HTMLElement).textContent || '').trim();
      result.unreachableControls.push(
        ariaLabel || text.slice(0, 50) || el.tagName.toLowerCase()
      );
    }

    // Check if controls respond to keyboard
    // Heuristic: buttons and role="button" are natively keyboard-activatable
    const hasNativeButtons = focusableElements.some(
      (el) =>
        el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'
    );
    result.controlsActivatableWithKeyboard = hasNativeButtons;

    return result;
  }, containerSelector);
}

async function checkAriaLabels(
  page: Page,
  player: DetectedPlayer
): Promise<AriaLabelResult> {
  const containerSelector = player.containerSelector;

  return page.evaluate((selector) => {
    const container = document.querySelector(selector);
    const labeledButtons: Array<{
      selector: string;
      accessibleName: string | null;
      role: string | null;
    }> = [];
    const unlabeledButtons: Array<{
      selector: string;
      accessibleName: string | null;
      role: string | null;
    }> = [];

    if (!container) {
      return {
        labeledButtons,
        unlabeledButtons,
        playerHasRole: false,
        playerHasAccessibleName: false,
      };
    }

    // Check player container
    const playerHasRole =
      container.getAttribute('role') !== null ||
      container.tagName === 'VIDEO' ||
      container.tagName === 'AUDIO';
    const playerHasAccessibleName =
      container.getAttribute('aria-label') !== null ||
      container.getAttribute('aria-labelledby') !== null ||
      container.getAttribute('title') !== null;

    // Check buttons
    const buttons = container.querySelectorAll(
      'button, [role="button"], [role="slider"]'
    );

    const buildSelector = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const classes = Array.from(el.classList).slice(0, 2).join('.');
      const tag = el.tagName.toLowerCase();
      return classes ? `${tag}.${classes}` : tag;
    };

    for (const btn of buttons) {
      const ariaLabel = btn.getAttribute('aria-label');
      const ariaLabelledby = btn.getAttribute('aria-labelledby');
      const title = btn.getAttribute('title');
      const textContent = (btn.textContent || '').trim();
      const role = btn.getAttribute('role') || (btn.tagName === 'BUTTON' ? 'button' : null);

      let accessibleName: string | null = null;

      if (ariaLabel) {
        accessibleName = ariaLabel;
      } else if (ariaLabelledby) {
        const refEl = document.getElementById(ariaLabelledby);
        accessibleName = refEl ? (refEl.textContent || '').trim() : ariaLabelledby;
      } else if (textContent) {
        accessibleName = textContent;
      } else if (title) {
        accessibleName = title;
      }

      const info: AriaButtonInfo = {
        selector: buildSelector(btn),
        accessibleName,
        role,
      };

      if (accessibleName && accessibleName.length > 0) {
        labeledButtons.push(info);
      } else {
        unlabeledButtons.push(info);
      }
    }

    return {
      labeledButtons,
      unlabeledButtons,
      playerHasRole,
      playerHasAccessibleName,
    };
  }, containerSelector);
}

async function checkFocusIndicators(
  page: Page,
  player: DetectedPlayer
): Promise<FocusIndicatorResult> {
  const containerSelector = player.containerSelector;

  return page.evaluate((selector) => {
    const container = document.querySelector(selector);
    const controlsWithFocusIndicator: string[] = [];
    const controlsWithoutFocusIndicator: string[] = [];

    if (!container) {
      return { controlsWithFocusIndicator, controlsWithoutFocusIndicator };
    }

    const focusable = container.querySelectorAll(
      'button, [role="button"], input[type="range"], [tabindex="0"], a[href]'
    );

    for (const el of focusable) {
      const htmlEl = el as HTMLElement;
      const isHidden =
        htmlEl.offsetParent === null &&
        getComputedStyle(el).position !== 'fixed';
      if (isHidden) continue;

      // Focus the element and check for visible focus indicator
      htmlEl.focus();
      const styles = getComputedStyle(el);
      const outlineStyle = styles.outlineStyle;
      const outlineWidth = parseFloat(styles.outlineWidth);
      const boxShadow = styles.boxShadow;

      const hasOutline = outlineStyle !== 'none' && outlineWidth > 0;
      const hasBoxShadow = boxShadow !== 'none' && boxShadow !== '';

      // Also check :focus-visible via pseudo-class (heuristic)
      const label =
        el.getAttribute('aria-label') ||
        (el.textContent || '').trim().slice(0, 30) ||
        el.tagName.toLowerCase();

      if (hasOutline || hasBoxShadow) {
        controlsWithFocusIndicator.push(label);
      } else {
        controlsWithoutFocusIndicator.push(label);
      }

      htmlEl.blur();
    }

    return { controlsWithFocusIndicator, controlsWithoutFocusIndicator };
  }, containerSelector);
}

async function checkCaptionCustomization(
  page: Page,
  player: DetectedPlayer
): Promise<CaptionCustomizationResult> {
  const containerSelector = player.containerSelector;

  return page.evaluate((selector) => {
    const result: {
      hasFontSizeControl: boolean;
      hasColorControl: boolean;
      hasBackgroundControl: boolean;
      hasOpacityControl: boolean;
      hasPositionControl: boolean;
      detectedOptions: string[];
    } = {
      hasFontSizeControl: false,
      hasColorControl: false,
      hasBackgroundControl: false,
      hasOpacityControl: false,
      hasPositionControl: false,
      detectedOptions: [],
    };

    const container = document.querySelector(selector) || document;

    // Gather all text content from menus, settings panels, options
    const settingSelectors = [
      '[class*="settings"]',
      '[class*="menu"]',
      '[class*="caption"]',
      '[class*="subtitle"]',
      '[class*="preferences"]',
      '[role="menu"]',
      '[role="dialog"]',
      'dialog',
    ];

    let allText = '';
    for (const sel of settingSelectors) {
      container.querySelectorAll(sel).forEach((el) => {
        allText += ' ' + ((el as HTMLElement).textContent || '');
      });
    }

    // Also check inputs/selects
    const inputs = container.querySelectorAll(
      'input[type="color"], input[type="range"], select'
    );
    for (const input of inputs) {
      const label =
        input.getAttribute('aria-label') ||
        input.getAttribute('name') ||
        '';
      allText += ' ' + label;
    }

    allText = allText.toLowerCase();

    const fontPatterns = ['font size', 'text size', 'font-size', 'fontsize'];
    const colorPatterns = ['font color', 'text color', 'font-color', 'foreground color'];
    const bgPatterns = ['background color', 'background-color', 'bg color', 'window color'];
    const opacityPatterns = ['opacity', 'transparency', 'background opacity'];
    const positionPatterns = ['position', 'placement', 'alignment'];

    for (const p of fontPatterns) {
      if (allText.includes(p)) {
        result.hasFontSizeControl = true;
        result.detectedOptions.push('font size');
        break;
      }
    }
    for (const p of colorPatterns) {
      if (allText.includes(p)) {
        result.hasColorControl = true;
        result.detectedOptions.push('font color');
        break;
      }
    }
    for (const p of bgPatterns) {
      if (allText.includes(p)) {
        result.hasBackgroundControl = true;
        result.detectedOptions.push('background color');
        break;
      }
    }
    for (const p of opacityPatterns) {
      if (allText.includes(p)) {
        result.hasOpacityControl = true;
        result.detectedOptions.push('opacity');
        break;
      }
    }
    for (const p of positionPatterns) {
      if (allText.includes(p)) {
        result.hasPositionControl = true;
        result.detectedOptions.push('position');
        break;
      }
    }

    return result;
  }, containerSelector);
}

async function checkControlContrast(
  page: Page,
  player: DetectedPlayer
): Promise<ContrastResult> {
  const containerSelector = player.containerSelector;

  return page.evaluate((selector) => {
    const container = document.querySelector(selector);
    const result: {
      controlsChecked: number;
      controlsBelowMinimum: number;
      controlsBelowEnhanced: number;
      lowestRatio: number;
      details: Array<{ selector: string; ratio: number; foreground: string; background: string }>;
    } = {
      controlsChecked: 0,
      controlsBelowMinimum: 0,
      controlsBelowEnhanced: 0,
      lowestRatio: Infinity,
      details: [],
    };

    if (!container) return { ...result, lowestRatio: 0 };

    // Parse rgb/rgba color string to [r, g, b] in 0-255 range
    function parseColor(color: string): [number, number, number] | null {
      const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (rgbMatch) {
        return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
      }
      return null;
    }

    // Linearize an sRGB channel value (0-255) to linear light (0-1)
    function linearize(channel: number): number {
      const s = channel / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }

    // Calculate relative luminance per WCAG 2.x
    function relativeLuminance(r: number, g: number, b: number): number {
      return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
    }

    // Calculate contrast ratio between two colors
    function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
      const l1 = relativeLuminance(fg[0], fg[1], fg[2]);
      const l2 = relativeLuminance(bg[0], bg[1], bg[2]);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    // Walk up the DOM tree to find an effective background color
    function getEffectiveBackground(el: Element): [number, number, number] {
      let current: Element | null = el;
      while (current) {
        const bgColor = getComputedStyle(current).backgroundColor;
        const parsed = parseColor(bgColor);
        if (parsed) {
          // Check if it's not fully transparent
          const alphaMatch = bgColor.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)/);
          const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
          if (alpha > 0.1) return parsed;
        }
        current = current.parentElement;
      }
      // Default to white background if nothing found
      return [255, 255, 255];
    }

    const buildSelector = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      const classes = Array.from(el.classList).slice(0, 2).join('.');
      const tag = el.tagName.toLowerCase();
      return classes ? `${tag}.${classes}` : tag;
    };

    const controls = container.querySelectorAll(
      'button, [role="button"], [role="slider"], input[type="range"], a[href]'
    );

    for (const el of controls) {
      const htmlEl = el as HTMLElement;
      const isHidden =
        htmlEl.offsetParent === null &&
        getComputedStyle(el).position !== 'fixed';
      if (isHidden) continue;

      const styles = getComputedStyle(el);
      const fgColor = parseColor(styles.color);
      const bgColor = getEffectiveBackground(el);

      if (!fgColor) continue;

      result.controlsChecked++;
      const ratio = contrastRatio(fgColor, bgColor);
      const roundedRatio = Math.round(ratio * 100) / 100;

      if (roundedRatio < result.lowestRatio) {
        result.lowestRatio = roundedRatio;
      }

      if (roundedRatio < 3) {
        result.controlsBelowMinimum++;
        result.details.push({
          selector: buildSelector(el),
          ratio: roundedRatio,
          foreground: styles.color,
          background: styles.backgroundColor,
        });
      } else if (roundedRatio < 4.5) {
        result.controlsBelowEnhanced++;
        result.details.push({
          selector: buildSelector(el),
          ratio: roundedRatio,
          foreground: styles.color,
          background: styles.backgroundColor,
        });
      }
    }

    if (result.controlsChecked === 0) {
      result.lowestRatio = 0;
    }

    return result;
  }, containerSelector);
}

async function checkTouchTargets(
  page: Page,
  player: DetectedPlayer
): Promise<TouchTargetResult> {
  const containerSelector = player.containerSelector;

  // First, get all visible control selectors from the browser context
  const controlSelectors: string[] = await page.evaluate((selector) => {
    const container = document.querySelector(selector);
    if (!container) return [];

    const selectors: string[] = [];
    const controls = container.querySelectorAll(
      'button, [role="button"], [role="slider"], input[type="range"], a[href]'
    );

    let index = 0;
    for (const el of controls) {
      const htmlEl = el as HTMLElement;
      const isHidden =
        htmlEl.offsetParent === null &&
        getComputedStyle(el).position !== 'fixed';
      if (isHidden) continue;

      // Build a unique selector using data attribute
      const uniqueAttr = `data-tt-check-${index}`;
      el.setAttribute(uniqueAttr, '1');
      selectors.push(`[${uniqueAttr}="1"]`);
      index++;
    }
    return selectors;
  }, containerSelector);

  const undersizedControls: Array<{ selector: string; width: number; height: number }> = [];
  let controlsChecked = 0;

  for (const sel of controlSelectors) {
    const el = await page.$(sel);
    if (!el) continue;

    const box = await el.boundingBox();
    if (!box) continue;

    controlsChecked++;
    const width = Math.round(box.width * 100) / 100;
    const height = Math.round(box.height * 100) / 100;

    if (width < 24 || height < 24) {
      // Get a human-readable label for this control
      const label = await el.evaluate((node) => {
        const htmlNode = node as HTMLElement;
        if (htmlNode.id) return `#${htmlNode.id}`;
        const ariaLabel = htmlNode.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel;
        const text = (htmlNode.textContent || '').trim().slice(0, 30);
        if (text) return text;
        const classes = Array.from(htmlNode.classList).slice(0, 2).join('.');
        const tag = htmlNode.tagName.toLowerCase();
        return classes ? `${tag}.${classes}` : tag;
      });
      undersizedControls.push({ selector: label, width, height });
    }
  }

  // Clean up the temporary data attributes
  await page.evaluate((selector) => {
    const container = document.querySelector(selector);
    if (!container) return;
    const controls = container.querySelectorAll('[data-tt-check-0], [data-tt-check-1], [data-tt-check-2], [data-tt-check-3], [data-tt-check-4], [data-tt-check-5], [data-tt-check-6], [data-tt-check-7], [data-tt-check-8], [data-tt-check-9]');
    for (const el of controls) {
      const attrs = Array.from(el.attributes).filter(a => a.name.startsWith('data-tt-check-'));
      for (const attr of attrs) {
        el.removeAttribute(attr.name);
      }
    }
  }, containerSelector);

  return {
    controlsChecked,
    undersizedControls,
    allMeetMinimum: undersizedControls.length === 0,
  };
}

export async function checkPlayerAccessibility(
  page: Page,
  player: DetectedPlayer
): Promise<PlayerAccessibilityResult> {
  const [keyboardNavigation, ariaLabels, focusIndicators, captionCustomization, controlContrast, touchTargets] =
    await Promise.all([
      checkKeyboardNavigation(page, player),
      checkAriaLabels(page, player),
      checkFocusIndicators(page, player),
      checkCaptionCustomization(page, player),
      checkControlContrast(page, player),
      checkTouchTargets(page, player),
    ]);

  return {
    keyboardNavigation,
    ariaLabels,
    focusIndicators,
    captionCustomization,
    controlContrast,
    touchTargets,
  };
}
