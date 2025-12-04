import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    const classes = [
      'animate-pulse rounded-md bg-gray-200',
      className
    ].filter(Boolean).join(' ');
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
