import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function AppointmentsLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <SkeletonPageHeader />

      <Card className="space-y-4 p-5">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Skeleton className="size-10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
