import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../../theme/colors';

interface WeeklySetHexagonProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const WeeklySetHexagon: React.FC<WeeklySetHexagonProps> = ({
  percentage,
  size = 200,
  strokeWidth: manualStrokeWidth,
}) => {
  const strokeWidth = manualStrokeWidth || Math.max(2, size / 20);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  
  // Responsive font size: roughly 28% of the container size
  const fontSize = Math.max(12, size * 0.28);
  const letterSpacing = size > 100 ? -2 : -0.5;

  // Calculate hexagon points
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }

  // Create path string for the hexagon
  const hexagonPath = `M ${points[0].x} ${points[0].y} ` +
    points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';

  // For the progress, we use strokeDasharray.
  // Side length of a regular hexagon is the same as its circumradius.
  const totalLength = radius * 6;
  const strokeDashoffset = totalLength - (totalLength * (percentage / 100));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="hexagonGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4ADE80" stopOpacity="1" />
            <Stop offset="0.2" stopColor="#FACC15" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#F87171" stopOpacity="1" />
            <Stop offset="0.8" stopColor="#818CF8" stopOpacity="1" />
            <Stop offset="1" stopColor="#22D3EE" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <G>
          {/* Background Hexagon (Static border) */}
          <Path
            d={hexagonPath}
            fill="none"
            stroke={colors.surfaceElevated}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            opacity={0.3}
          />
          
          {/* Subtle multi-colored track */}
          <Path
            d={hexagonPath}
            fill="none"
            stroke="url(#hexagonGrad)"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            opacity={0.5}
          />

          {/* Progress Overlay (Active part) */}
          {percentage > 0 && (
            <Path
              d={hexagonPath}
              fill="none"
              stroke="url(#hexagonGrad)"
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeDasharray={totalLength}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          )}
        </G>
      </Svg>
      <View style={styles.content}>
        <Text style={[styles.percentage, { fontSize, letterSpacing }]}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
});
