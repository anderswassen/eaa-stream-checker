import type { EN301549Clause } from "../types/audit.js";

// EN 301 549 Clause 9 maps directly to WCAG 2.1 Level AA success criteria.
// The clause numbering mirrors WCAG: EN 301 549 clause 9.X.Y.Z corresponds to WCAG X.Y.Z.

const clause9Mappings: Record<string, EN301549Clause> = {
  // Principle 1: Perceivable
  "1.1.1": { id: "9.1.1.1", title: "Non-text Content", wcagMapping: "1.1.1", helpText: "All images, icons, and non-text content must have text alternatives that describe their purpose or content." },
  "1.2.1": { id: "9.1.2.1", title: "Audio-only and Video-only (Prerecorded)", wcagMapping: "1.2.1", helpText: "Provide a text transcript for audio-only content and either a transcript or audio track for video-only content." },
  "1.2.2": { id: "9.1.2.2", title: "Captions (Prerecorded)", wcagMapping: "1.2.2", helpText: "All prerecorded video with audio must include synchronized captions so deaf or hard-of-hearing users can follow along." },
  "1.2.3": { id: "9.1.2.3", title: "Audio Description or Media Alternative (Prerecorded)", wcagMapping: "1.2.3", helpText: "Prerecorded video must have audio description or a full text alternative describing the visual content." },
  "1.2.4": { id: "9.1.2.4", title: "Captions (Live)", wcagMapping: "1.2.4", helpText: "Live video streams with audio must provide real-time captions for viewers who cannot hear the audio." },
  "1.2.5": { id: "9.1.2.5", title: "Audio Description (Prerecorded)", wcagMapping: "1.2.5", helpText: "Prerecorded video must include an audio description track that narrates important visual information." },
  "1.3.1": { id: "9.1.3.1", title: "Info and Relationships", wcagMapping: "1.3.1", helpText: "Page structure like headings, lists, and tables must be correctly marked up so assistive technologies can convey them." },
  "1.3.2": { id: "9.1.3.2", title: "Meaningful Sequence", wcagMapping: "1.3.2", helpText: "Content must be presented in a logical reading order that is preserved when styles are removed." },
  "1.3.3": { id: "9.1.3.3", title: "Sensory Characteristics", wcagMapping: "1.3.3", helpText: "Instructions must not rely solely on shape, size, position, or sound (e.g., 'click the round button')." },
  "1.3.4": { id: "9.1.3.4", title: "Orientation", wcagMapping: "1.3.4", helpText: "Content must work in both portrait and landscape orientation unless a specific orientation is essential." },
  "1.3.5": { id: "9.1.3.5", title: "Identify Input Purpose", wcagMapping: "1.3.5", helpText: "Form fields collecting personal data (name, email, address) must identify their purpose so browsers can offer autofill." },
  "1.4.1": { id: "9.1.4.1", title: "Use of Color", wcagMapping: "1.4.1", helpText: "Color must not be the only way to convey information. Use labels, patterns, or icons alongside color." },
  "1.4.2": { id: "9.1.4.2", title: "Audio Control", wcagMapping: "1.4.2", helpText: "If audio plays automatically for more than 3 seconds, users must be able to pause, stop, or control its volume." },
  "1.4.3": { id: "9.1.4.3", title: "Contrast (Minimum)", wcagMapping: "1.4.3", helpText: "Text must have a contrast ratio of at least 4.5:1 against its background so it is readable for users with low vision." },
  "1.4.4": { id: "9.1.4.4", title: "Resize Text", wcagMapping: "1.4.4", helpText: "Text must be resizable up to 200% without losing content or functionality." },
  "1.4.5": { id: "9.1.4.5", title: "Images of Text", wcagMapping: "1.4.5", helpText: "Use real text instead of images of text, so users can resize, recolor, or reflow the content." },
  "1.4.10": { id: "9.1.4.10", title: "Reflow", wcagMapping: "1.4.10", helpText: "Content must reflow to fit a 320px-wide screen without requiring horizontal scrolling." },
  "1.4.11": { id: "9.1.4.11", title: "Non-text Contrast", wcagMapping: "1.4.11", helpText: "UI components and graphical elements must have a contrast ratio of at least 3:1 against adjacent colors." },
  "1.4.12": { id: "9.1.4.12", title: "Text Spacing", wcagMapping: "1.4.12", helpText: "Content must remain readable and functional when users increase line height, letter spacing, or word spacing." },
  "1.4.13": { id: "9.1.4.13", title: "Content on Hover or Focus", wcagMapping: "1.4.13", helpText: "Popups or tooltips that appear on hover or focus must be dismissable, hoverable, and persistent until the user removes them." },

  // Principle 2: Operable
  "2.1.1": { id: "9.2.1.1", title: "Keyboard", wcagMapping: "2.1.1", helpText: "All functionality must be operable using a keyboard alone, without requiring a mouse or touch." },
  "2.1.2": { id: "9.2.1.2", title: "No Keyboard Trap", wcagMapping: "2.1.2", helpText: "Users navigating with a keyboard must never get trapped in a component and must always be able to move away." },
  "2.1.4": { id: "9.2.1.4", title: "Character Key Shortcuts", wcagMapping: "2.1.4", helpText: "If single-character keyboard shortcuts exist, users must be able to turn them off or remap them to avoid accidental activation." },
  "2.2.1": { id: "9.2.2.1", title: "Timing Adjustable", wcagMapping: "2.2.1", helpText: "If content has a time limit, users must be able to turn off, adjust, or extend it." },
  "2.2.2": { id: "9.2.2.2", title: "Pause, Stop, Hide", wcagMapping: "2.2.2", helpText: "Moving, blinking, or auto-updating content must have controls to pause, stop, or hide it." },
  "2.3.1": { id: "9.2.3.1", title: "Three Flashes or Below Threshold", wcagMapping: "2.3.1", helpText: "Content must not flash more than three times per second to avoid triggering seizures." },
  "2.4.1": { id: "9.2.4.1", title: "Bypass Blocks", wcagMapping: "2.4.1", helpText: "Provide a way to skip repeated content blocks (like navigation menus) so keyboard users can jump to the main content." },
  "2.4.2": { id: "9.2.4.2", title: "Page Titled", wcagMapping: "2.4.2", helpText: "Each page must have a descriptive title that identifies its topic or purpose." },
  "2.4.3": { id: "9.2.4.3", title: "Focus Order", wcagMapping: "2.4.3", helpText: "When navigating with a keyboard, the focus order must follow a logical and meaningful sequence." },
  "2.4.4": { id: "9.2.4.4", title: "Link Purpose (In Context)", wcagMapping: "2.4.4", helpText: "The purpose of each link must be clear from the link text or its surrounding context (avoid generic 'click here')." },
  "2.4.5": { id: "9.2.4.5", title: "Multiple Ways", wcagMapping: "2.4.5", helpText: "Provide more than one way to find a page within your service, such as search, navigation menus, or a site map." },
  "2.4.6": { id: "9.2.4.6", title: "Headings and Labels", wcagMapping: "2.4.6", helpText: "Headings and form labels must clearly describe the topic or purpose of the content they introduce." },
  "2.4.7": { id: "9.2.4.7", title: "Focus Visible", wcagMapping: "2.4.7", helpText: "Keyboard focus must be visually indicated so users can see which element is currently active." },
  "2.5.1": { id: "9.2.5.1", title: "Pointer Gestures", wcagMapping: "2.5.1", helpText: "Any action requiring multi-point or path-based gestures (like pinch or swipe) must also work with a simple single-pointer tap or click." },
  "2.5.2": { id: "9.2.5.2", title: "Pointer Cancellation", wcagMapping: "2.5.2", helpText: "Actions must not trigger on the down-press of a pointer; users must be able to cancel by moving away before releasing." },
  "2.5.3": { id: "9.2.5.3", title: "Label in Name", wcagMapping: "2.5.3", helpText: "The accessible name of a component must include the visible label text so voice control users can activate it by speaking what they see." },
  "2.5.4": { id: "9.2.5.4", title: "Motion Actuation", wcagMapping: "2.5.4", helpText: "Any action triggered by device motion (like shaking) must also be available through standard UI controls and be disableable." },

  // Principle 3: Understandable
  "3.1.1": { id: "9.3.1.1", title: "Language of Page", wcagMapping: "3.1.1", helpText: "The page must declare its primary language (e.g., lang='en') so screen readers use the correct pronunciation." },
  "3.1.2": { id: "9.3.1.2", title: "Language of Parts", wcagMapping: "3.1.2", helpText: "Content in a different language than the page default must be marked with the appropriate language attribute." },
  "3.2.1": { id: "9.3.2.1", title: "On Focus", wcagMapping: "3.2.1", helpText: "Moving focus to an element must not automatically trigger unexpected changes like navigating to a new page." },
  "3.2.2": { id: "9.3.2.2", title: "On Input", wcagMapping: "3.2.2", helpText: "Changing a form input value must not automatically cause unexpected actions unless the user is warned in advance." },
  "3.2.3": { id: "9.3.2.3", title: "Consistent Navigation", wcagMapping: "3.2.3", helpText: "Navigation menus must appear in the same order on every page so users can predict where to find things." },
  "3.2.4": { id: "9.3.2.4", title: "Consistent Identification", wcagMapping: "3.2.4", helpText: "Components with the same function must be identified consistently across all pages (same icons, labels, and names)." },
  "3.3.1": { id: "9.3.3.1", title: "Error Identification", wcagMapping: "3.3.1", helpText: "When a form error is detected, the specific field in error must be identified and the error described in text." },
  "3.3.2": { id: "9.3.3.2", title: "Labels or Instructions", wcagMapping: "3.3.2", helpText: "Form fields must have visible labels or instructions so users know what information is expected." },
  "3.3.3": { id: "9.3.3.3", title: "Error Suggestion", wcagMapping: "3.3.3", helpText: "When an input error is detected, suggest a correction if possible (e.g., 'Did you mean .com instead of .con?')." },
  "3.3.4": { id: "9.3.3.4", title: "Error Prevention (Legal, Financial, Data)", wcagMapping: "3.3.4", helpText: "For actions with legal or financial consequences, users must be able to review, correct, or reverse their submissions." },

  // Principle 4: Robust
  "4.1.1": { id: "9.4.1.1", title: "Parsing", wcagMapping: "4.1.1", helpText: "The page HTML must be well-formed with no duplicate IDs or unclosed tags that could confuse assistive technologies." },
  "4.1.2": { id: "9.4.1.2", title: "Name, Role, Value", wcagMapping: "4.1.2", helpText: "All interactive elements must expose their name, role, and state to assistive technologies (e.g., buttons must be identifiable as buttons)." },
  "4.1.3": { id: "9.4.1.3", title: "Status Messages", wcagMapping: "4.1.3", helpText: "Status updates (like 'item added to cart') must be announced to screen readers without moving focus." },
};

/**
 * Map a WCAG criterion (e.g. "2.4.7") to its EN 301 549 Clause 9 equivalent.
 */
export function mapWcagToEN301549(wcagCriterion: string): EN301549Clause | undefined {
  return clause9Mappings[wcagCriterion];
}

/**
 * Map multiple WCAG criteria to EN 301 549 clause IDs.
 */
export function mapWcagCriteriaToClauseIds(wcagCriteria: string[]): string[] {
  const clauseIds: string[] = [];
  for (const criterion of wcagCriteria) {
    const mapping = clause9Mappings[criterion];
    if (mapping) {
      clauseIds.push(mapping.id);
    }
  }
  return clauseIds;
}

/**
 * Get all Clause 9 mappings.
 */
export function getAllClause9Mappings(): Record<string, EN301549Clause> {
  return { ...clause9Mappings };
}
