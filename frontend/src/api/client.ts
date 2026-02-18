import type { ScanReport } from '../types/report';
import mockReport from '../mocks/report.json';

const USE_MOCK = true;

export async function startScan(url: string): Promise<{ id: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { id: mockReport.id };
  }
  const res = await fetch('/api/scan', {
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
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { status: 'completed' };
  }
  const res = await fetch(`/api/scan/${id}`);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

export async function getReport(id: string): Promise<ScanReport> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockReport as ScanReport;
  }
  const res = await fetch(`/api/report/${id}`);
  if (!res.ok) throw new Error(`Report fetch failed: ${res.statusText}`);
  return res.json();
}
