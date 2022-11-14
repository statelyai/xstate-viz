import { chakra, keyframes } from '@chakra-ui/react';
import React from 'react';

const delayProgress = keyframes`
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
`;

export const DelayViz: React.FC<{ active: boolean; duration: number }> = ({
  active,
  duration,
}) => {
  return (
    <chakra.svg
      viewBox="0 0 100 100"
      css={{
        opacity: active ? 1 : 0.5,
        transition: 'opacity 0.3s ease',
      }}
      style={{
        transform: 'rotate(-90deg)',
        display: 'inline-block',
        width: '1rem',
        height: '1rem',
        overflow: 'visible',
        // @ts-ignore
        '--duration': duration,
      }}
    >
      <chakra.circle
        css={{ opacity: 0.4 }}
        cx={50}
        cy={50}
        r={45}
        strokeDasharray={1}
        pathLength={1}
        stroke="#fff"
        fill="transparent"
      />
      <chakra.circle
        css={{
          transition: 'opacity 0.3s ease',
          strokeWidth: 20,
          ...(active && {
            animation: `${delayProgress} calc(var(--delay, 0) * 1ms) both linear`,
          }),
        }}
        cx={50}
        cy={50}
        r={45}
        strokeDasharray={1}
        pathLength={1}
        stroke="#fff"
        fill="transparent"
      />
    </chakra.svg>
  );
};
