import { Skeleton } from "@/components/ui/skeleton";

export default function AskLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-64" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-36 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
