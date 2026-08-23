'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getWatchIdentifier } from '@/lib/watch-id';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function WatchButton({
  address,
  chainId,
}: {
  address: string;
  chainId?: number;
}) {
  const [watched, setWatched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const identifier = getWatchIdentifier();
    const params = new URLSearchParams({ identifier });
    if (chainId !== undefined) params.set('chainId', String(chainId));
    fetch(`${API_URL}/hooks/${encodeURIComponent(address)}/watch?${params}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as { watched?: boolean };
        setWatched(Boolean(body.watched));
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [address, chainId]);

  async function toggle(): Promise<void> {
    setBusy(true);
    const identifier = getWatchIdentifier();
    const params = new URLSearchParams({ identifier });
    if (chainId !== undefined) params.set('chainId', String(chainId));
    try {
      const response = await fetch(
        `${API_URL}/hooks/${encodeURIComponent(address)}/watch?${params}`,
        {
          method: watched ? 'DELETE' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: watched ? undefined : JSON.stringify({ identifier }),
        },
      );
      if (response.ok) {
        const body = (await response.json()) as { watched?: boolean };
        setWatched(Boolean(body.watched));
      }
    } catch {
      // Keep prior state when the API is unreachable.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={watched ? 'secondary' : 'default'}
      size="sm"
      onClick={() => void toggle()}
      disabled={busy || !ready}
    >
      {watched ? 'Watching' : 'Watch hook'}
    </Button>
  );
}
