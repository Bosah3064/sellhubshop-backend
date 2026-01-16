import { cn } from "@/lib/utils"

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
)

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Stats skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} className="h-24" />
      ))}
    </div>
    
    {/* Content skeleton */}
    <SkeletonCard className="h-64" />
    <SkeletonCard className="h-96" />
  </div>
)

export const ProductCardSkeleton = () => (
  <div className="border rounded-lg p-4 animate-pulse">
    <SkeletonCard className="h-48 w-full mb-4" />
    <SkeletonCard className="h-4 w-3/4 mb-2" />
    <SkeletonCard className="h-4 w-1/2" />
    <SkeletonCard className="h-6 w-1/3 mt-2" />
  </div>
)

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <SkeletonCard key={i} className="h-12" />
    ))}
  </div>
)