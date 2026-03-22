import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

// ─── Simple Helper Component for Images ───────────────────────────────────────

function ExerciseImage({ uri, style }: { uri: string; style: any }) {
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const CATEGORY_IMAGES: Record<string, string> = {
  'upper': 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?auto=format&fit=crop&w=400&q=80',
  'lower': 'https://images.unsplash.com/photo-1574673130244-c707aaac4848?auto=format&fit=crop&w=400&q=80',
  'full': 'https://images.unsplash.com/photo-1541534741688-6078c65b5a33?auto=format&fit=crop&w=400&q=80',
  'push': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80',
  'pull': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
  'legs': 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=400&q=80',
  'rest': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
  'hypertrophy': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
  'strength': 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?auto=format&fit=crop&w=400&q=80',
};

function getCategoryThumbnail(workoutType: string) {
  const type = workoutType.toLowerCase();
  
  if (type.includes('upper')) return CATEGORY_IMAGES['upper'];
  if (type.includes('lower')) return CATEGORY_IMAGES['lower'];
  if (type.includes('push')) return CATEGORY_IMAGES['push'];
  if (type.includes('pull')) return CATEGORY_IMAGES['pull'];
  if (type.includes('legs')) return CATEGORY_IMAGES['legs'];
  if (type.includes('full')) return CATEGORY_IMAGES['full'];
  if (type.includes('rest') || type.includes('recovery')) return CATEGORY_IMAGES['rest'];
  if (type.includes('hypertrophy')) return CATEGORY_IMAGES['hypertrophy'];
  if (type.includes('strength')) return CATEGORY_IMAGES['strength'];
  
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface SwapWorkoutSheetProps {
  visible: boolean;
  onClose: () => void;
  currentWorkoutDayId?: string;
  splitDays: any[];
  onSelectDay: (day: any) => void;
  onPickMuscles: () => void;
  onCreateCustom: () => void;
  onSavedWorkouts?: () => void;
  onOnDemand?: () => void;
}

export default function SwapWorkoutSheet({
  visible,
  onClose,
  currentWorkoutDayId,
  splitDays,
  onSelectDay,
  onPickMuscles,
  onCreateCustom,
  onSavedWorkouts,
  onOnDemand,
}: SwapWorkoutSheetProps) {
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], maxHeight: '85%' }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Swap Workout</Text>
              <Text style={styles.subtitle}>Choose your focus for today</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Section 1: Within Training Split */}
            <Text style={styles.sectionLabel}>Within Training Split</Text>
            <View style={{ marginBottom: 24 }}>
              {splitDays.length === 0 ? (
                <View style={styles.emptySplit}>
                  <Text style={styles.emptySplitText}>No other workouts in this week.</Text>
                </View>
              ) : (
                splitDays.map((day) => {
                  const isSelected = day.id === currentWorkoutDayId;
                  const categoryThumb = getCategoryThumbnail(day.workoutType);
                  const firstExMedia = day.exercisePrescriptions?.[0]?.exercise?.mediaUrl;
                  
                  return (
                    <TouchableOpacity 
                      key={day.id} 
                      style={[
                        styles.dayRow, 
                        isSelected && { backgroundColor: 'rgba(0, 194, 255, 0.05)' }
                      ]} 
                      onPress={() => { onSelectDay(day); }}
                    >
                      <View style={styles.dayThumb}>
                        {categoryThumb ? (
                          <ExerciseImage uri={categoryThumb} style={StyleSheet.absoluteFill} />
                        ) : firstExMedia ? (
                          <ExerciseImage uri={firstExMedia} style={StyleSheet.absoluteFill} />
                        ) : (
                          <Ionicons name="barbell-outline" size={24} color={colors.textMuted} />
                        )}
                        {categoryThumb && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />}
                        {isSelected && (
                          <View style={styles.dayCheckBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={colors.brandPrimary} />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dayName, isSelected && { color: colors.brandPrimary, fontWeight: '700' }]}>
                          {day.workoutType}
                        </Text>
                        {isSelected ? (
                          <Text style={styles.currentStatusText}>CURRENT SELECTION</Text>
                        ) : (
                          <Text style={styles.dayStatsText}>{day.exercisePrescriptions?.length || 0} Exercises</Text>
                        )}
                      </View>
                      <View style={[styles.radio, isSelected && styles.radioActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Section 2: New Workout */}
            <Text style={styles.sectionLabel}>New Workout</Text>
            <View style={styles.grid}>
              <TouchableOpacity style={styles.gridCard} onPress={() => { onClose(); onPickMuscles(); }}>
                <View style={styles.gridHeader}>
                  <Ionicons name="body-outline" size={20} color={colors.brandPrimary} />
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
                <Text style={styles.gridTitle}>Pick{"\n"}Muscles</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridCard} onPress={() => { onClose(); onSavedWorkouts?.(); }}>
                <View style={styles.gridHeader}>
                  <Ionicons name="bookmark-outline" size={20} color={colors.brandPrimary} />
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
                <Text style={styles.gridTitle}>Saved{"\n"}Workouts</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridCard} onPress={() => { onClose(); onCreateCustom(); }}>
                <View style={styles.gridHeader}>
                  <Ionicons name="pencil-outline" size={20} color={colors.brandPrimary} />
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
                <Text style={styles.gridTitle}>Create Workout{"\n"}From Scratch</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridCard} onPress={() => { onClose(); onOnDemand?.(); }}>
                <View style={styles.gridHeader}>
                  <Ionicons name="play-outline" size={20} color={colors.brandPrimary} />
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
                <Text style={styles.gridTitle}>On Demand{"\n"}Workouts</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C26',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 12,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginHorizontal: -8,
    gap: 14,
  },
  dayThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dayCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1C1C26',
    borderRadius: 10,
  },
  dayName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  dayStatsText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  currentStatusText: { fontSize: 11, color: colors.brandPrimary, fontWeight: '500', marginTop: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.brandPrimary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    height: 110,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  emptySplit: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
  },
  emptySplitText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
