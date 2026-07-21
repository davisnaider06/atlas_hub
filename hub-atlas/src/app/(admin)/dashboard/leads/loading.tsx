import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <SkeletonPageHeader />

      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <Skeleton className="h-11 w-full max-w-sm rounded-xl" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-9 shrink-0" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-48" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
