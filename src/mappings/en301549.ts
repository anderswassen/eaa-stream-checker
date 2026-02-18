import type { EN301549Clause } from "../types/audit.js";

// EN 301 549 Clause 9 maps directly to WCAG 2.1 Level AA success criteria.
// The clause numbering mirrors WCAG: EN 301 549 clause 9.X.Y.Z corresponds to WCAG X.Y.Z.

const clause9Mappings: Record<string, EN301549Clause> = {
  // Principle 1: Perceivable
  "1.1.1": { id: "9.1.1.1", title: "Non-text Content", wcagMapping: "1.1.1" },
  "1.2.1": { id: "9.1.2.1", title: "Audio-only and Video-only (Prerecorded)", wcagMapping: "1.2.1" },
  "1.2.2": { id: "9.1.2.2", title: "Captions (Prerecorded)", wcagMapping: "1.2.2" },
  "1.2.3": { id: "9.1.2.3", title: "Audio Description or Media Alternative (Prerecorded)", wcagMapping: "1.2.3" },
  "1.2.4": { id: "9.1.2.4", title: "Captions (Live)", wcagMapping: "1.2.4" },
  "1.2.5": { id: "9.1.2.5", title: "Audio Description (Prerecorded)", wcagMapping: "1.2.5" },
  "1.3.1": { id: "9.1.3.1", title: "Info and Relationships", wcagMapping: "1.3.1" },
  "1.3.2": { id: "9.1.3.2", title: "Meaningful Sequence", wcagMapping: "1.3.2" },
  "1.3.3": { id: "9.1.3.3", title: "Sensory Characteristics", wcagMapping: "1.3.3" },
  "1.3.4": { id: "9.1.3.4", title: "Orientation", wcagMapping: "1.3.4" },
  "1.3.5": { id: "9.1.3.5", title: "Identify Input Purpose", wcagMapping: "1.3.5" },
  "1.4.1": { id: "9.1.4.1", title: "Use of Color", wcagMapping: "1.4.1" },
  "1.4.2": { id: "9.1.4.2", title: "Audio Control", wcagMapping: "1.4.2" },
  "1.4.3": { id: "9.1.4.3", title: "Contrast (Minimum)", wcagMapping: "1.4.3" },
  "1.4.4": { id: "9.1.4.4", title: "Resize Text", wcagMapping: "1.4.4" },
  "1.4.5": { id: "9.1.4.5", title: "Images of Text", wcagMapping: "1.4.5" },
  "1.4.10": { id: "9.1.4.10", title: "Reflow", wcagMapping: "1.4.10" },
  "1.4.11": { id: "9.1.4.11", title: "Non-text Contrast", wcagMapping: "1.4.11" },
  "1.4.12": { id: "9.1.4.12", title: "Text Spacing", wcagMapping: "1.4.12" },
  "1.4.13": { id: "9.1.4.13", title: "Content on Hover or Focus", wcagMapping: "1.4.13" },

  // Principle 2: Operable
  "2.1.1": { id: "9.2.1.1", title: "Keyboard", wcagMapping: "2.1.1" },
  "2.1.2": { id: "9.2.1.2", title: "No Keyboard Trap", wcagMapping: "2.1.2" },
  "2.1.4": { id: "9.2.1.4", title: "Character Key Shortcuts", wcagMapping: "2.1.4" },
  "2.2.1": { id: "9.2.2.1", title: "Timing Adjustable", wcagMapping: "2.2.1" },
  "2.2.2": { id: "9.2.2.2", title: "Pause, Stop, Hide", wcagMapping: "2.2.2" },
  "2.3.1": { id: "9.2.3.1", title: "Three Flashes or Below Threshold", wcagMapping: "2.3.1" },
  "2.4.1": { id: "9.2.4.1", title: "Bypass Blocks", wcagMapping: "2.4.1" },
  "2.4.2": { id: "9.2.4.2", title: "Page Titled", wcagMapping: "2.4.2" },
  "2.4.3": { id: "9.2.4.3", title: "Focus Order", wcagMapping: "2.4.3" },
  "2.4.4": { id: "9.2.4.4", title: "Link Purpose (In Context)", wcagMapping: "2.4.4" },
  "2.4.5": { id: "9.2.4.5", title: "Multiple Ways", wcagMapping: "2.4.5" },
  "2.4.6": { id: "9.2.4.6", title: "Headings and Labels", wcagMapping: "2.4.6" },
  "2.4.7": { id: "9.2.4.7", title: "Focus Visible", wcagMapping: "2.4.7" },
  "2.5.1": { id: "9.2.5.1", title: "Pointer Gestures", wcagMapping: "2.5.1" },
  "2.5.2": { id: "9.2.5.2", title: "Pointer Cancellation", wcagMapping: "2.5.2" },
  "2.5.3": { id: "9.2.5.3", title: "Label in Name", wcagMapping: "2.5.3" },
  "2.5.4": { id: "9.2.5.4", title: "Motion Actuation", wcagMapping: "2.5.4" },

  // Principle 3: Understandable
  "3.1.1": { id: "9.3.1.1", title: "Language of Page", wcagMapping: "3.1.1" },
  "3.1.2": { id: "9.3.1.2", title: "Language of Parts", wcagMapping: "3.1.2" },
  "3.2.1": { id: "9.3.2.1", title: "On Focus", wcagMapping: "3.2.1" },
  "3.2.2": { id: "9.3.2.2", title: "On Input", wcagMapping: "3.2.2" },
  "3.2.3": { id: "9.3.2.3", title: "Consistent Navigation", wcagMapping: "3.2.3" },
  "3.2.4": { id: "9.3.2.4", title: "Consistent Identification", wcagMapping: "3.2.4" },
  "3.3.1": { id: "9.3.3.1", title: "Error Identification", wcagMapping: "3.3.1" },
  "3.3.2": { id: "9.3.3.2", title: "Labels or Instructions", wcagMapping: "3.3.2" },
  "3.3.3": { id: "9.3.3.3", title: "Error Suggestion", wcagMapping: "3.3.3" },
  "3.3.4": { id: "9.3.3.4", title: "Error Prevention (Legal, Financial, Data)", wcagMapping: "3.3.4" },

  // Principle 4: Robust
  "4.1.1": { id: "9.4.1.1", title: "Parsing", wcagMapping: "4.1.1" },
  "4.1.2": { id: "9.4.1.2", title: "Name, Role, Value", wcagMapping: "4.1.2" },
  "4.1.3": { id: "9.4.1.3", title: "Status Messages", wcagMapping: "4.1.3" },
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
