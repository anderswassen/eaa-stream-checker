import type { Page } from 'playwright';

// --- Player Detection ---

export type PlayerSDK =
  | 'hls.js'
  | 'dash.js'
  | 'shaka'
  | 'videojs'
  | 'jwplayer'
  | 'bitmovin'
  | 'plyr'
  | 'eyevinn'
  | 'native'
  | 'unknown';

export interface DetectedPlayer {
  sdk: PlayerSDK;
  version: string | null;
  containerSelector: string;
  mediaElements: MediaElementInfo[];
}

export interface MediaElementInfo {
  tagName: 'video' | 'audio';
  selector: string;
  src: string | null;
  hasTracks: boolean;
  trackCount: number;
}

// --- Manifest Parsing ---

export interface ManifestInfo {
  url: string;
  type: 'hls' | 'dash';
  subtitleTracks: ManifestTrack[];
  audioTracks: ManifestAudioTrack[];
}

export interface ManifestTrack {
  language: string | null;
  name: string | null;
  uri: string | null;
  isDefault: boolean;
  autoSelect: boolean;
  forced: boolean;
}

export interface ManifestAudioTrack {
  language: string | null;
  name: string | null;
  uri: string | null;
  isDefault: boolean;
  autoSelect: boolean;
  isAudioDescription: boolean;
  characteristics: string | null;
}

// --- Caption Checking ---

export interface CaptionCheckResult {
  domTracks: DomTrackInfo[];
  manifestTracks: ManifestTrack[];
  playerApiTracks: PlayerApiTrackInfo[];
  hasCaptions: boolean;
  hasLanguageAttributes: boolean;
}

export interface DomTrackInfo {
  kind: string;
  src: string | null;
  srclang: string | null;
  label: string | null;
  parentSelector: string;
}

export interface PlayerApiTrackInfo {
  label: string | null;
  language: string | null;
  kind: string | null;
}

// --- Audio Description Checking ---

export interface AudioDescriptionCheckResult {
  domDescriptionTracks: DomTrackInfo[];
  manifestADTracks: ManifestAudioTrack[];
  hasAudioDescription: boolean;
  hasADSelector: boolean;
}

// --- Player Accessibility ---

export interface PlayerAccessibilityResult {
  keyboardNavigation: KeyboardNavigationResult;
  ariaLabels: AriaLabelResult;
  focusIndicators: FocusIndicatorResult;
  captionCustomization: CaptionCustomizationResult;
}

export interface KeyboardNavigationResult {
  canTabIntoPlayer: boolean;
  reachableControls: string[];
  unreachableControls: string[];
  tabStopsToPlay: number;
  tabStopsToCaptions: number;
  tabStopsToAD: number;
  controlsActivatableWithKeyboard: boolean;
}

export interface AriaLabelResult {
  labeledButtons: AriaButtonInfo[];
  unlabeledButtons: AriaButtonInfo[];
  playerHasRole: boolean;
  playerHasAccessibleName: boolean;
}

export interface AriaButtonInfo {
  selector: string;
  accessibleName: string | null;
  role: string | null;
}

export interface FocusIndicatorResult {
  controlsWithFocusIndicator: string[];
  controlsWithoutFocusIndicator: string[];
}

export interface CaptionCustomizationResult {
  hasFontSizeControl: boolean;
  hasColorControl: boolean;
  hasBackgroundControl: boolean;
  hasOpacityControl: boolean;
  hasPositionControl: boolean;
  detectedOptions: string[];
}

// --- EN 301 549 Clause 7 Mapping ---

export type ComplianceStatus = 'pass' | 'fail' | 'needs_review' | 'not_applicable';
export type Severity = 'critical' | 'major' | 'minor';

export interface StreamingFinding {
  clauseId: string;
  clauseTitle: string;
  status: ComplianceStatus;
  description: string;
  evidence: string;
  severity: Severity;
}

// --- Top-level Result ---

export interface StreamingAnalysisResult {
  playerDetected: boolean;
  playerType: string | null;
  playerVersion: string | null;
  players: DetectedPlayer[];
  captions: CaptionCheckResult;
  audioDescription: AudioDescriptionCheckResult;
  playerAccessibility: PlayerAccessibilityResult | null;
  manifests: ManifestInfo[];
  findings: StreamingFinding[];
}

// --- Module function signatures ---

export type AnalyzeStreamingPage = (page: Page) => Promise<StreamingAnalysisResult>;
