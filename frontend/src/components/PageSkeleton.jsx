import React from 'react';
import Skeleton from './dashboard/Skeleton';

const PageSkeleton = () => {
  return (
    <div className="pl-4 md:pl-16 pr-4 lg:pr-8 pt-16 sm:pt-8 pb-8 space-y-8 bg-slate-900 min-h-screen text-slate-100">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-48 bg-slate-800" />
          <Skeleton variant="text" className="h-4 w-64 bg-slate-800" />
        </div>
        <Skeleton variant="text" className="h-10 w-24 rounded-lg bg-slate-800" />
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 animate-pulse">
          <Skeleton variant="text" className="h-6 w-3/4 bg-slate-800" />
          <Skeleton variant="card" className="bg-slate-800" />
          <Skeleton variant="text" className="h-4 w-1/2 bg-slate-800" />
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 animate-pulse">
          <Skeleton variant="text" className="h-6 w-1/2 bg-slate-800" />
          <Skeleton variant="card" className="bg-slate-800" />
          <Skeleton variant="text" className="h-4 w-2/3 bg-slate-800" />
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 animate-pulse">
          <Skeleton variant="text" className="h-6 w-2/3 bg-slate-800" />
          <Skeleton variant="card" className="bg-slate-800" />
          <Skeleton variant="text" className="h-4 w-3/4 bg-slate-800" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 animate-pulse">
        <Skeleton variant="text" className="h-6 w-1/4 bg-slate-800" />
        <Skeleton variant="chart" className="bg-slate-800" />
      </div>
    </div>
  );
};

export default PageSkeleton;
