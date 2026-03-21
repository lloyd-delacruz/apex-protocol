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
  strokeWidth = 10,
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  
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

  // For the progress, we can use dasharray or segments. 
  // A simpler way for a hexagon is to draw it and use strokeDasharray.
  const perimeter = radius * 6; // Rough approximation for hexagon perimeter
  // Better approximation: side length is radius
  const sideLength = radius * 1;
  const totalLength = sideLength * 6;
  const strokeDashoffset = totalLength - (totalLength * (percentage / 100));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brandPrimary} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.accentSecondary} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <G>
          {/* Background Hexagon */}
          <Path
            d={hexagonPath}
            fill="none"
            stroke={colors.border}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Progress Hexagon */}
          <Path
            d={hexagonPath}
            fill="none"
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeDasharray={totalLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.content}>
        <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
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
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
});
