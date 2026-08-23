import { LoadingState } from '@/components/loading-state';
import { AppShell } from '@/components/layout/app-shell';

export default function Loading() {
  return (
    <AppShell>
      <LoadingState label="Loading landscape metrics" />
    </AppShell>
  );
}
