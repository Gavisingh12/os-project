  
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type AnimationVariant = {
  hidden: string;
  visible: string;
};

interface AnimateOnMountProps {
  children: React.ReactNode;
  animation: AnimationVariant;
  className?: string;
  delay?: number;
}

/**
 * Component that animates its children when mounted
 * Simple replacement for framer-motion animations
 */
const AnimateOnMount: React.FC<AnimateOnMountProps> = ({
  children,
  animation,
  className,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={cn(
      isVisible ? animation.visible : animation.hidden,
      className
    )}>
      {children}
    </div>
  );
};

export default AnimateOnMount;
