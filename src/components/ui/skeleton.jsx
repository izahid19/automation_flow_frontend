import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50 shimmer", className)}
      {...props}
    />
  );
}

export { Skeleton };
