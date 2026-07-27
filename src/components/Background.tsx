import { useEffect, useState } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function useIsPageVisible(): boolean {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

// WebGL background is heavy on mobile/low-power devices (SPEC.md §10.4),
// so small screens and prefers-reduced-motion get a static CSS gradient instead.
export function Background() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const isPageVisible = useIsPageVisible();

  if (prefersReducedMotion || isSmallScreen) {
    return (
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950"
      />
    );
  }

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <ShaderGradientCanvas pointerEvents="none" style={{ width: '100%', height: '100%' }}>
        <ShaderGradient
          type="waterPlane"
          animate={isPageVisible ? 'on' : 'off'}
          color1="#8b5cf6"
          color2="#3b82f6"
          color3="#0f172a"
          brightness={1.1}
          grain="off"
          cAzimuthAngle={180}
          cPolarAngle={80}
          cDistance={4}
          cameraZoom={1}
        />
      </ShaderGradientCanvas>
      <div className="absolute inset-0 bg-slate-950/40" />
    </div>
  );
}
