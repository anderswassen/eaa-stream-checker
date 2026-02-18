import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { startScan, getScanStatus } from '../api/client';

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ScanPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL.');
      inputRef.current?.focus();
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError('Please enter a valid URL (e.g., https://example.com).');
      inputRef.current?.focus();
      return;
    }

    setScanning(true);
    setProgress('Starting scan\u2026');

    try {
      const { id } = await startScan(url.trim());
      setProgress('Analyzing page accessibility\u2026');

      // Poll until scan completes or fails
      let status = 'in_progress';
      while (status === 'in_progress') {
        await new Promise((r) => setTimeout(r, 2000));
        const result = await getScanStatus(id);
        status = result.status;
        if (status === 'in_progress') {
          setProgress('Scanning\u2026 this may take up to 30 seconds.');
        }
      }

      if (status === 'failed') {
        throw new Error('Scan failed. Please check the URL and try again.');
      }

      navigate(`/report/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
      setScanning(false);
      setProgress('');
      inputRef.current?.focus();
    }
  }

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">
            EAA Stream Checker
          </h1>
          <p className="text-lg text-gray-600">
            Check your streaming service for European Accessibility Act
            compliance. Paste a URL to get an EN&nbsp;301&nbsp;549 compliance
            report.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url-input" className="sr-only">
              Streaming site URL
            </label>
            <input
              ref={inputRef}
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="https://example-streaming.eu"
              disabled={scanning}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'url-error' : undefined}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-2 focus:outline-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {error && (
              <p id="url-error" role="alert" className="text-red-700 text-sm">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={scanning}
            className="w-full rounded-lg bg-blue-700 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {scanning ? 'Scanning\u2026' : 'Check Compliance'}
          </button>
        </form>

        {scanning && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-2"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
            <p className="text-gray-600">{progress}</p>
          </div>
        )}
      </div>
    </main>
  );
}
