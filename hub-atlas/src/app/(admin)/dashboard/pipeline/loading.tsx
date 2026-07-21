import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <SkeletonPageHeader />

      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, coluna) => (
          <div key={coluna} className="glass-panel w-72 shrink-0 rounded-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-5 rounded-full" />
            </div>
            <div className="flex flex-col gap-2 p-2.5">
              {Array.from({ length: 2 }).map((_, card) => (
                <div
                  key={card}
                  className="flex items-center gap-2.5 rounded-xl border border-border p-2.5"
                >
                  <Skeleton className="size-8 shrink-0" />
                  <div className="w-full space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
