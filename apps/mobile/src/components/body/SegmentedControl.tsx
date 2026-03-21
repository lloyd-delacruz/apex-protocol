import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../theme/colors';

interface SegmentedControlProps {
  options: string[];
  selectedOption: string;
  onOptionPress: (option: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedOption,
  onOptionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {options.map((option) => {
          const isActive = selectedOption === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.segment,
                isActive && styles.activeSegment,
              ]}
              onPress={() => onOptionPress(option)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.activeSegmentText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  inner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeSegment: {
    backgroundColor: '#2A2A3C', // Deep dark for active background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeSegmentText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
