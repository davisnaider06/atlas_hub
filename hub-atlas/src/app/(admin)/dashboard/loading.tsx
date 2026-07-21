import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <SkeletonPageHeader />

      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="space-y-4 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="space-y-4 p-5 lg:col-span-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-56 w-full" />
        </Card>
        <Card className="space-y-4 p-5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </Card>
      </div>
    </div>
  );
}
