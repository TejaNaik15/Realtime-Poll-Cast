import React, { useId, useMemo } from 'react';
import { motion, useTime, useTransform } from 'motion/react';

/**
 * SquigglyText — ported to plain JSX (no TS, no Tailwind, no shadcn)
 *
 * Props:
 *   children      — text/nodes to squiggle
 *   steps         — number of filter frames (default 5)
 *   stepDuration  — ms per frame (default 80)
 *   scale         — displacement px, number or [a,b] tuple (default [6,8])
 *   baseFrequency — SVG turbulence freq (default 0.02)
 *   numOctaves    — turbulence octaves (default 3)
 *   className     — extra class names
 *   style         — extra inline styles
 */
export function SquigglyText({
  children,
  steps = 5,
  stepDuration = 80,
  scale = [6, 8],
  baseFrequency = 0.02,
  numOctaves = 3,
  className = '',
  style = {},
}) {
  const reactId = useId();
  const safeId = reactId.replace(/[:_]/g, '');
  const filterId = (i) => `squiggly-${safeId}-${i}`;

  const filters = useMemo(
    () => Array.from({ length: steps }, (_, i) => `url(#${filterId(i)})`),
    [steps, safeId]
  );

  const time = useTime();
  const filter = useTransform(
    time,
    (t) => filters[Math.floor(t / stepDuration) % filters.length]
  );

  const scaleAt = (i) => (Array.isArray(scale) ? scale[i % scale.length] : scale);

  return (
    <motion.span
      style={{ filter, display: 'inline-block', ...style }}
      className={className}
    >
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          height: 0,
          width: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {Array.from({ length: steps }).map((_, i) => (
            <filter id={filterId(i)} key={i}>
              <feTurbulence
                baseFrequency={baseFrequency}
                numOctaves={numOctaves}
                result="noise"
                seed={i}
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={scaleAt(i)}
              />
            </filter>
          ))}
        </defs>
      </svg>
      {children}
    </motion.span>
  );
}
