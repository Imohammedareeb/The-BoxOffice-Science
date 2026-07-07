export default function Loading() {
  return (
    <div className="p-8 md:p-10">
      {/* Page header skeleton */}
      <div className="mb-10 p-8 bg-surface-container-lowest dark:bg-[#1e2026] relative overflow-hidden">
        <div className="flex items-end gap-4 mb-3">
          <div className="h-6 w-20 shimmer-loading" />
          <div className="h-16 w-72 shimmer-loading" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-[#4C69F6]/30" />
          <div className="h-3 w-48 shimmer-loading" />
        </div>
      </div>

      {/* Bento grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shimmer-loading border-4 border-black/10 dark:border-white/10"
            style={{
              height: i === 0 ? "320px" : i === 1 ? "240px" : "180px",
              gridColumn: i === 0 ? "span 2" : "span 1",
            }}
          />
        ))}
      </div>

      {/* Loading label */}
      <div className="flex items-center justify-center gap-3 mt-12">
        <span
          className="font-headline font-black text-xs uppercase tracking-[0.3em] text-on-surface-variant dark:text-[#c5c4d6]"
          style={{ animation: "pulse 1.5s ease-in-out infinite" }}
        >
          Loading Intelligence...
        </span>
      </div>
    </div>
  );
}
