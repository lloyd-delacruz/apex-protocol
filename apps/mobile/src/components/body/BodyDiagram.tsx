import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface BodyDiagramProps {
  onMusclePress: (muscleId: string, name: string) => void;
  fatiguedMuscles?: string[]; // Expecting lowercase groups like 'chest', 'back', 'arms', 'legs', 'core', 'shoulders'
}

export const BodyDiagram: React.FC<BodyDiagramProps> = ({ onMusclePress, fatiguedMuscles = [] }) => {
  const isFatigued = (group: string) => fatiguedMuscles.includes(group.toLowerCase());

  const getFill = (group: string) => isFatigued(group) ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.1)';
  const getStroke = (group: string) => isFatigued(group) ? colors.danger : 'rgba(255,255,255,0.2)';

  return (
    <View style={styles.container}>
      <Svg width={width * 0.8} height={width * 1.2} viewBox="0 0 200 300">
        <G transform="translate(0, 0)">
          {/* Head */}
          <Path d="M100,20 a15,15 0 1,0 0.1,0 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          
          {/* Torso / Chest */}
          <Path 
            d="M75,50 L125,50 L130,90 L70,90 Z" 
            fill={getFill('chest')} 
            stroke={getStroke('chest')}
            onPress={() => onMusclePress('chest', 'Chest')}
          />
          
          {/* Core (Abs) */}
          <Path 
            d="M70,95 L130,95 L125,140 L75,140 Z" 
            fill={getFill('core')} 
            stroke={getStroke('core')}
            onPress={() => onMusclePress('core', 'Core')}
          />

          {/* Shoulders */}
          <Path d="M60,55 L75,50 L75,70 L65,75 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} onPress={() => onMusclePress('shoulders', 'Shoulders')} />
          <Path d="M140,55 L125,50 L125,70 L135,75 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} onPress={() => onMusclePress('shoulders', 'Shoulders')} />

          {/* Arms */}
          <G onPress={() => onMusclePress('arms', 'Arms')}>
            <Path d="M55,75 L65,75 L60,110 L50,110 Z" fill={getFill('arms')} stroke={getStroke('arms')} />
            <Path d="M145,75 L135,75 L140,110 L150,110 Z" fill={getFill('arms')} stroke={getStroke('arms')} />
            <Path d="M50,115 L60,115 L55,150 L45,150 Z" fill={getFill('arms')} stroke={getStroke('arms')} />
            <Path d="M150,115 L140,115 L145,150 L155,150 Z" fill={getFill('arms')} stroke={getStroke('arms')} />
          </G>

          {/* Legs */}
          <G onPress={() => onMusclePress('legs', 'Legs')}>
            <Path d="M75,145 L98,145 L98,200 L70,200 Z" fill={getFill('legs')} stroke={getStroke('legs')} />
            <Path d="M102,145 L125,145 L130,200 L102,200 Z" fill={getFill('legs')} stroke={getStroke('legs')} />
            <Path d="M70,205 L98,205 L95,260 L75,260 Z" fill={getFill('legs')} stroke={getStroke('legs')} />
            <Path d="M102,205 L130,205 L125,260 L105,260 Z" fill={getFill('legs')} stroke={getStroke('legs')} />
          </G>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
});
