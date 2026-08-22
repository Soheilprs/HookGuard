import { AppShell } from '@/components/layout/app-shell';
import { CardsLoadingState, LoadingState } from '@/components/loading-state';

export default function DashboardLoading() {
  return (
    <AppShell>
      <CardsLoadingState />
      <div className="mt-6 rounded-xl border border-border">
        <LoadingState label="Loading dashboard" />
      </div>
    </AppShell>
  );
}
