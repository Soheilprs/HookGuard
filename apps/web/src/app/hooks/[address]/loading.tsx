import { AppShell } from '@/components/layout/app-shell';
import { LoadingState } from '@/components/loading-state';

export default function HookDetailLoading() {
  return (
    <AppShell>
      <div className="rounded-xl border border-border">
        <LoadingState label="Loading hook" />
      </div>
    </AppShell>
  );
}
