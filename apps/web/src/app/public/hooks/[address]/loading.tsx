import { LoadingState } from '@/components/loading-state';

export default function Loading() {
  return (
    <div className="container py-16">
      <LoadingState label="Loading public hook security page" />
    </div>
  );
}
