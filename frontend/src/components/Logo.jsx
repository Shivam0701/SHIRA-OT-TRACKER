import React from 'react';

/**
 * SHIRA OT Tracker logo component.
 * size: pixel size of the square logo image (default 36)
 * showText: whether to render the product name beside the logo (default true)
 * variant: 'sidebar' | 'auth' | 'icon'
 */
export default function Logo({ size = 36, showText = true, variant = 'sidebar' }) {
  if (variant === 'icon') {
    return <img src="/logo.svg" alt="SHIRA OT" width={size} height={size} style={{ borderRadius: 8, display: 'block' }} />;
  }

  if (variant === 'auth') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <img src="/logo.svg" alt="SHIRA OT" width={size} height={size} style={{ borderRadius: 10 }} />
        {showText && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>SHIRA OT</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Overtime Tracker</div>
          </div>
        )}
      </div>
    );
  }

  // sidebar variant
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="/logo.svg" alt="SHIRA OT" width={size} height={size} style={{ borderRadius: 8, flexShrink: 0 }} />
      {showText && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>SHIRA OT</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Overtime Tracker</div>
        </div>
      )}
    </div>
  );
}
