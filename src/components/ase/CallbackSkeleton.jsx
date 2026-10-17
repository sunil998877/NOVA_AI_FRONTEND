import React from "react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function CallbackSkeleton() {
  return (
    <Card className="rounded-xl border border-border/70 shadow-sm bg-card">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <div className="space-y-3 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CallbackSkeletonList({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <CallbackSkeleton key={index} />
      ))}
    </div>
  );
}
