'use client';

interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'text';
  rows?: number;
  columns?: number;
}

export default function LoadingSkeleton({
  type = 'table',
  rows = 5,
  columns = 5,
}: LoadingSkeletonProps) {
  if (type === 'table') {
    return (
      <div className="w-full space-y-3 animate-pulse">
        {/* Table Header */}
        <div className="flex gap-4 px-6 py-3 bg-white/5 rounded-lg">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={`header-${i}`}
              className="h-4 bg-white/10 rounded flex-1"
            />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex gap-4 px-6 py-4 bg-white/5 rounded-lg"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 bg-white/10 rounded flex-1"
                style={{
                  animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`card-${i}`}
            className="bg-white/5 rounded-lg p-6 space-y-4"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
            <div className="h-8 bg-white/10 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Text skeleton
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={`text-${i}`}
          className="h-4 bg-white/10 rounded"
          style={{
            width: `${Math.random() * 30 + 70}%`,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
