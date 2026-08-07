// OpenDating brand mark — two overlapping circles forming an abstract OD monogram.
// Renders as native SVG via react-native-svg. Accepts size and color overrides.
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '@/state/theme-context';

interface BrandMarkProps {
  size?: number;
  color?: string;
}

export function BrandMark({ size = 64, color }: BrandMarkProps) {
  const { colors } = useTheme();
  const strokeColor = color ?? colors.accent;
  const strokeWidth = size * 0.109; // proportional to 112px on 1024 viewBox

  // ViewBox is 1024x1024; the mark spans ~(175, 285)-(765, 720)
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <G fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Left circle — the "O" */}
        <Circle cx={360} cy={545} r={175} />
        {/* Right circle — the "D" bowl */}
        <Circle cx={590} cy={545} r={175} />
        {/* Vertical stroke — the "D" stem */}
        <Path d="M765 285 L765 545" />
      </G>
    </Svg>
  );
}

// Full lockup: brand mark + "OpenDating" wordmark
interface BrandLockupProps {
  size?: number;
  color?: string;
  dark?: boolean;
}

export function BrandLockup({ size = 32, color, dark }: BrandLockupProps) {
  const { colors } = useTheme();
  const markColor = color ?? (dark ? '#F0856E' : colors.accent);

  return (
    <BrandMark size={size} color={markColor} />
  );
}
