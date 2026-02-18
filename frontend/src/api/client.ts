import type { ScanReport } from '../types/report';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function startScan(url: string): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Scan request failed: ${res.statusText}`);
  return res.json();
}

export async function getScanStatus(
  id: string,
): Promise<{ status: ScanReport['status'] }> {
  const res = await fetch(`${API_BASE}/api/scan/${id}`);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

export async function getReport(id: string): Promise<ScanReport> {
  const res = await fetch(`${API_BASE}/api/report/${id}`);
  if (!res.ok) throw new Error(`Report fetch failed: ${res.statusText}`);
  return res.json();
}
