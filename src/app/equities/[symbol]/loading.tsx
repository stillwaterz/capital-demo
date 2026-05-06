import { Skeleton } from "@/components/ui/skeleton";

export default function EquityDetailLoading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-md" />
        <Skeleton className="h-9 w-16 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
