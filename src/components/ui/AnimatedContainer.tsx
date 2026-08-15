'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  /**
   * Render visible immediately, with no entrance animation. Use this for
   * anything above the fold — see the comment in the component body.
   */
  immediate?: boolean;
}

export default function AnimatedContainer({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  immediate = false,
}: AnimatedContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  // The reveal starts at opacity 0 and only plays once React has hydrated and
  // the in-view effect has fired. For content already on screen at load that
  // makes the text invisible for as long as hydration takes — it made the
  // landing hero's <h1> the LCP element with 2.4s of render delay on mobile.
  // Above the fold there is nothing to reveal anyway, so skip the wrapper and
  // let the server HTML paint.
  if (immediate) {
    return <div className={className}>{children}</div>;
  }

  const directionVariants = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionVariants[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
