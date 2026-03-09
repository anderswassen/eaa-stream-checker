import { EventEmitter } from "events";

export interface ScanProgressEvent {
  type: "phase" | "web_complete" | "streaming_complete" | "page_scanned" | "complete" | "error";
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

const emitters = new Map<string, EventEmitter>();

export function createScanEmitter(id: string): EventEmitter {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(10);
  emitters.set(id, emitter);
  // Auto-cleanup after 5 minutes
  setTimeout(() => {
    emitter.removeAllListeners();
    emitters.delete(id);
  }, 300_000);
  return emitter;
}

export function getScanEmitter(id: string): EventEmitter | undefined {
  return emitters.get(id);
}

export function emitScanProgress(id: string, event: ScanProgressEvent): void {
  const emitter = emitters.get(id);
  if (emitter) {
    emitter.emit("progress", event);
  }
}
