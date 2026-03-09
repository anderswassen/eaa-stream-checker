export interface ScanProgressEvent {
  type: 'phase' | 'web_complete' | 'streaming_complete' | 'page_scanned' | 'complete' | 'error';
  phase?: string;
  message?: string;
  passed?: number;
  failed?: number;
  incomplete?: number;
  playerType?: string | null;
  hasCaptions?: boolean;
  hasAudioDescription?: boolean;
  pageUrl?: string;
  pageTitle?: string;
  pageViolations?: number;
  pageCurrent?: number;
  pageTotal?: number;
  score?: number;
  id?: string;
}
