import { Skeleton } from "@/components/ui/skeleton";

export default function TBillsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
