import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

interface SimpleLineChartProps {
  data: ChartData;
  width: number;
  height: number;
}

export default function SimpleLineChart({ data, width, height }: SimpleLineChartProps) {
  const points = data.datasets[0].data;
  if (points.length < 2) return null;

  const min = Math.min(...points) * 0.98;
  const max = Math.max(...points) * 1.02;
  const range = max - min;

  const getX = (index: number) => (index / (points.length - 1)) * (width - 40) + 20;
  const getY = (value: number) => height - ((value - min) / range) * (height - 60) - 30;

  const d = points.reduce((acc, val, i) => {
    const x = getX(i);
    const y = getY(val);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Fill path for gradient
  const fillD = `${d} L ${getX(points.length - 1)} ${height} L ${getX(0)} ${height} Z`;

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.brandPrimary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={colors.brandPrimary} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {/* Fill Area */}
        <Path d={fillD} fill="url(#grad)" />
        
        {/* Line */}
        <Path 
          d={d} 
          fill="none" 
          stroke={colors.brandPrimary} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Data Points */}
        {points.map((val, i) => (
          <Circle 
            key={i} 
            cx={getX(i)} 
            cy={getY(val)} 
            r="4" 
            fill={colors.brandPrimary} 
            stroke={colors.background} 
            strokeWidth="2" 
          />
        ))}
      </Svg>
    </View>
  );
}
