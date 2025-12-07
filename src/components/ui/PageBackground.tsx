'use client';

interface PageBackgroundProps {
  variant?: 'default' | 'subtle' | 'intense';
}

export function PageBackground({ variant = 'default' }: PageBackgroundProps) {
  const opacityMap = {
    subtle: { orb: 'opacity-5', grid: 'opacity-[0.01]' },
    default: { orb: 'opacity-10', grid: 'opacity-[0.02]' },
    intense: { orb: 'opacity-15', grid: 'opacity-[0.03]' },
  };

  const opacity = opacityMap[variant];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient Orbs */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] ${opacity.orb} blur-[128px] rounded-full`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent)] ${opacity.orb} blur-[128px] rounded-full`} />
      <div className={`absolute top-3/4 left-1/2 w-64 h-64 bg-[var(--primary)] ${opacity.orb} blur-[100px] rounded-full`} />
      
      {/* Grid Pattern */}
      <div 
        className={`absolute inset-0 ${opacity.grid}`}
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}
