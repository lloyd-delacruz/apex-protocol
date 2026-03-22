import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Switch,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, statusColors, statusBackgrounds } from '../../theme/colors';
import { TrainingStatus } from '@apex/shared';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../services/api';
import ExercisePicker from '../../components/ExercisePicker';
import SwapWorkoutSheet from '../../components/SwapWorkoutSheet';
import GeneratingWorkoutModal from '../../components/GeneratingWorkoutModal';
import type { TodayWorkout, SessionExercise, ActiveSession } from '../../types/workout';
import type { SessionStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'apex_active_session';
const TOOLTIP_KEY = 'apex_tooltip_exerciseActions';
const DEFAULT_SETS = 3;
const DEFAULT_REST_SEC = 120;

// ─── Types ────────────────────────────────────────────────────────────────────
// SessionExercise, ActiveSession, TodayWorkout imported from ../../types/workout

interface WorkoutExercise {
  id: string;
  prescriptionId: string;
  name: string;
  muscle: string | null;
  sets: number;
  repMin: number;
  repMax: number;
  rirTarget: number;
  suggestedWeight: number;
  weightUnit: string;
  mediaUrl?: string | null;
}

interface LoggedSet {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
  setType: 'warmup' | 'working';
  status: TrainingStatus | null;
}

interface PersistedSession {
  sessionId: string;
  workoutDayId: string;
  startTimeISO: string;
  exercises: WorkoutExercise[];
  sessionExercises: Array<{ id: string; exerciseId: string; orderIndex: number }>;
  loggedSets: Record<string, LoggedSet[]>;
  elapsedSec: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateStatus(reps: number, repMin: number, repMax: number): TrainingStatus {
  if (reps >= repMax) return 'ACHIEVED';
  if (reps >= repMin) return 'PROGRESS';
  return 'FAILED';
}

function parseRepRange(range: string | null): { repMin: number; repMax: number } {
  if (!range) return { repMin: 8, repMax: 12 };
  const match = range.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { repMin: parseInt(match[1], 10), repMax: parseInt(match[2], 10) };
  const single = parseInt(range, 10);
  if (!isNaN(single)) return { repMin: single, repMax: single };
  return { repMin: 8, repMax: 12 };
}

function mapToExercises(workout: TodayWorkout): WorkoutExercise[] {
  if (!workout.workoutDay) return [];
  return [...workout.workoutDay.exercisePrescriptions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const { repMin, repMax } = parseRepRange(p.targetRepRange);
      const mediaUrl = p.exercise.mediaUrl || null;
      console.log(`[WorkoutScreen] exercise "${p.exercise.name}" mediaUrl:`, mediaUrl);
      return {
        id: p.exercise.id,
        prescriptionId: p.id,
        name: p.exercise.name,
        muscle: p.exercise.muscleGroup,
        sets: p.targetSets || DEFAULT_SETS,
        repMin,
        repMax,
        rirTarget: 2,
        suggestedWeight: p.suggestedWeight || 0,
        weightUnit: p.weightUnit || 'kg',
        mediaUrl,
      };
    });
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

async function saveSession(session: PersistedSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
async function loadSession(): Promise<PersistedSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// ─── HexagonBadge ─────────────────────────────────────────────────────────────

function HexagonBadgeFilled({ size = 32, color = colors.brandPrimary, iconName = 'checkmark', iconColor = '#fff' }: {
  size?: number;
  color?: string;
  iconName?: string;
  iconColor?: string;
}) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size * 0.18,
      backgroundColor: color,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Ionicons name={iconName as any} size={size * 0.5} color={iconColor} />
    </View>
  );
}

// ─── ExerciseOptionsSheet ─────────────────────────────────────────────────────

function ExerciseOptionsSheet({
  visible,
  exercise,
  onClose,
  onDelete,
  onReplace,
}: {
  visible: boolean;
  exercise: WorkoutExercise | null;
  onClose: () => void;
  onDelete: () => void;
  onReplace: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

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
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible && !exercise) return null;

  const menuItems = [
    { icon: 'play-circle-outline', label: 'Video & Instructions', onPress: () => {} },
    { icon: 'calendar-outline', label: 'Exercise History', onPress: () => {} },
    { icon: 'swap-horizontal-outline', label: 'Replace', onPress: () => { onClose(); onReplace(); } },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Drag handle */}
          <View style={sheetStyles.handle} />

          {/* Header */}
          <View style={sheetStyles.header}>
            <Text style={sheetStyles.title} numberOfLines={1}>{exercise?.name ?? ''}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.brandPrimary} />
            </TouchableOpacity>
          </View>

          {/* Menu items */}
          {menuItems.map((item, idx) => (
            <TouchableOpacity key={idx} style={sheetStyles.menuRow} onPress={item.onPress}>
              <Ionicons name={item.icon as any} size={22} color={colors.textPrimary} />
              <Text style={sheetStyles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={sheetStyles.divider} />
          
          <TouchableOpacity 
            style={[sheetStyles.menuRow, { paddingVertical: 16 }]} 
            onPress={() => { onClose(); onDelete(); }}
          >
            <Ionicons name="trash-outline" size={22} color="#FF453A" />
            <Text style={[sheetStyles.menuLabel, { color: '#FF453A' }]}>Delete Exercise</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}


const sheetStyles = StyleSheet.create({
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
});

// ─── ExerciseTooltip ──────────────────────────────────────────────────────────

function ExerciseTooltip({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  if (!visible) return null;
  return (
    <View style={tooltipStyles.container}>
      <View style={tooltipStyles.box}>
        <View style={tooltipStyles.arrowUp} />
        <Text style={tooltipStyles.title}>EXERCISE ACTIONS</Text>
        <Text style={tooltipStyles.body}>Hit this to replace or delete exercises.</Text>
        <TouchableOpacity style={tooltipStyles.btn} onPress={onDismiss}>
          <Text style={tooltipStyles.btnText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tooltipStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    top: 0,
    zIndex: 999,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E1E30',
    alignSelf: 'flex-end',
    marginRight: 12,
    marginBottom: -1,
  },
  box: {
    backgroundColor: '#1E1E30',
    borderRadius: 12,
    padding: 16,
    width: 220,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  title: { fontSize: 11, fontWeight: '800', color: colors.brandPrimary, letterSpacing: 1.5, marginBottom: 6 },
  body: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginBottom: 12 },
  btn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.brandPrimary },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ─── ConfettiParticles ────────────────────────────────────────────────────────

function ConfettiParticles() {
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(1),
      color: [colors.brandPrimary, colors.warning, colors.success, colors.danger, '#A855F7'][i % 5],
      size: 6 + Math.random() * 8,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p, i) => {
      const delay = i * 80;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.y, { toValue: 400 + Math.random() * 200, duration: 1500 + Math.random() * 1000, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 1500 + Math.random() * 1000, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            transform: [{ translateY: p.y }],
            opacity: p.opacity,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
          }}
        />
      ))}
    </View>
  );
}

// ─── StreakScreen ─────────────────────────────────────────────────────────────

function StreakScreen({
  onContinue,
  weeklyGoal,
  completedThisWeek,
}: {
  onContinue: () => void;
  weeklyGoal: number;
  completedThisWeek: number;
}) {
  const remaining = Math.max(0, weeklyGoal - completedThisWeek);
  const goalLabel = `${weeklyGoal} WORKOUTS / WEEK GOAL`;
  const progressText = remaining === 0
    ? 'Streak unlocked this week!'
    : `${remaining} to go this week`;

  return (
    <View style={streakStyles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={streakStyles.inner}>
        <TouchableOpacity style={streakStyles.closeBtn} onPress={onContinue}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={streakStyles.content}>
          <Text style={streakStyles.title}><Text style={{ fontStyle: 'italic' }}>Unlock your streak</Text></Text>
          <Text style={streakStyles.goalText}>{goalLabel}</Text>

          {/* Large locked/unlocked hexagon */}
          <View style={streakStyles.lockedHex}>
            <Ionicons
              name={remaining === 0 ? 'trophy' : 'lock-closed'}
              size={40}
              color={colors.warning}
            />
          </View>

          {/* Progress hexagons — one per weekly goal slot */}
          <View style={streakStyles.hexRow}>
            {Array.from({ length: weeklyGoal }).map((_, i) => (
              <View
                key={i}
                style={[streakStyles.hexProgress, i < completedThisWeek && streakStyles.hexDone]}
              >
                {i < completedThisWeek && (
                  <Ionicons name="checkmark" size={18} color="#0A0A0F" />
                )}
              </View>
            ))}
          </View>

          <Text style={streakStyles.goText}><Text style={{ fontStyle: 'italic' }}>{progressText}</Text></Text>
        </View>

        <TouchableOpacity style={streakStyles.continueBtn} onPress={onContinue}>
          <Text style={streakStyles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  closeBtn: { marginTop: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  goalText: { fontSize: 13, fontWeight: '700', color: colors.warning, letterSpacing: 1.5, textTransform: 'uppercase' },
  lockedHex: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  hexRow: { flexDirection: 'row', gap: 12 },
  hexProgress: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexDone: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  goText: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  continueBtn: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueBtnText: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
});

// ─── WorkoutCompleteScreen ────────────────────────────────────────────────────

function WorkoutCompleteScreen({
  exercises,
  loggedSets,
  elapsedSec,
  onShare,
  onDone,
}: {
  exercises: WorkoutExercise[];
  loggedSets: Record<string, LoggedSet[]>;
  elapsedSec: number;
  onShare: () => void;
  onDone: () => void;
}) {
  const totalVolume = useMemo(() => {
    let v = 0;
    Object.values(loggedSets).forEach(sets => sets.forEach(s => {
      const w = parseFloat(s.weight); const r = parseInt(s.reps, 10);
      if (!isNaN(w) && !isNaN(r)) v += w * r;
    }));
    return v;
  }, [loggedSets]);

  const cals = Math.floor(elapsedSec / 12);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <ConfettiParticles />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={completeStyles.scroll}>
          {/* Top bar */}
          <View style={completeStyles.topBar}>
            <Text style={completeStyles.dateText}>{dateStr} · {timeStr}</Text>
            <View style={completeStyles.topActions}>
              <TouchableOpacity onPress={onShare} style={completeStyles.topBtn}>
                <Ionicons name="share-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={completeStyles.topBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center muscle icon */}
          <View style={completeStyles.iconBadge}>
            <Ionicons name="body" size={52} color={colors.brandPrimary} />
          </View>

          {/* Workout name & duration */}
          <Text style={completeStyles.workoutName}>
            <Text style={{ fontStyle: 'italic' }}>Workout Complete</Text>
          </Text>
          <Text style={completeStyles.duration}>{fmtTime(elapsedSec)}</Text>

          {/* Stats row */}
          <View style={completeStyles.statsRow}>
            <View style={completeStyles.statCell}>
              <Text style={completeStyles.statLabel}>CALORIES</Text>
              <Text style={completeStyles.statValue}>{cals}</Text>
            </View>
            <View style={completeStyles.statDivider} />
            <View style={completeStyles.statCell}>
              <Text style={completeStyles.statLabel}>VOLUME</Text>
              <Text style={completeStyles.statValue}>{totalVolume.toLocaleString()} lb</Text>
            </View>
          </View>

          {/* Exercise section */}
          <Text style={completeStyles.sectionTitle}>
            {exercises.length} {exercises.length === 1 ? 'Exercise' : 'Exercises'}
          </Text>

          {exercises.map((ex, idx) => {
            const sets = loggedSets[ex.id] ?? [];
            const lastSet = sets[sets.length - 1];
            const repsStr = lastSet ? `${lastSet.reps} reps` : `${ex.repMin} reps`;
            const weightStr = lastSet ? `x ${lastSet.weight} lb` : `x ${ex.suggestedWeight} lb`;

            return (
              <View key={ex.id} style={completeStyles.exRow}>
                <View style={completeStyles.exThumb}>
                  {ex.mediaUrl ? (
                    <Image source={{ uri: ex.mediaUrl }} style={completeStyles.exThumbImg} />
                  ) : (
                    <View style={completeStyles.exThumbPlaceholder}>
                      <Ionicons name="barbell-outline" size={20} color={colors.textMuted} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {idx === 0 && <Text style={completeStyles.focusLabel}>FOCUS EXERCISE</Text>}
                  <Text style={completeStyles.exName}>{ex.name}</Text>
                  <Text style={completeStyles.exMeta}>{repsStr} {weightStr}</Text>
                </View>
                <HexagonBadgeFilled size={32} color={colors.success} iconName="checkmark" iconColor="#fff" />
              </View>
            );
          })}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom actions */}
        <View style={completeStyles.bottomActions}>
          <TouchableOpacity style={completeStyles.shareBtn} onPress={onShare}>
            <Text style={completeStyles.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={completeStyles.doneBtn} onPress={onDone}>
            <Text style={completeStyles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const completeStyles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  dateText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  topActions: { flexDirection: 'row', gap: 12 },
  topBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,194,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(0,194,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  workoutName: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  duration: { fontSize: 18, color: colors.textMuted, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 28,
    overflow: 'hidden',
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  exThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  exThumbImg: { width: '100%', height: '100%' },
  exThumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  focusLabel: { fontSize: 10, fontWeight: '800', color: colors.warning, letterSpacing: 1.2, marginBottom: 2 },
  exName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  exMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 36,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  shareBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  doneBtn: {
    flex: 1.5,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

// ─── SetInputRow ──────────────────────────────────────────────────────────────

function SetInputRow({
  setNum,
  isWarmup,
  repMin,
  repMax,
  rirTarget,
  suggestedWeight,
  onLog,
  loggedSet,
}: {
  setNum: number;
  isWarmup: boolean;
  repMin: number;
  repMax: number;
  rirTarget: number;
  suggestedWeight: number;
  onLog: (data: { weight: string; reps: string; rir: string; setType: 'warmup' | 'working' }) => void;
  loggedSet?: LoggedSet;
}) {
  const [weight, setWeight] = useState(suggestedWeight > 0 ? suggestedWeight.toString() : '');
  const [reps, setReps] = useState('');

  const isLogged = !!loggedSet;
  const displayReps = isLogged ? loggedSet.reps : reps;
  const displayWeight = isLogged ? loggedSet.weight : weight;

  const handleLog = () => {
    if (isLogged) return;
    onLog({
      weight: weight.trim() || (suggestedWeight > 0 ? suggestedWeight.toString() : '0'),
      reps: reps.trim() || repMin.toString(),
      rir: rirTarget.toString(),
      setType: isWarmup ? 'warmup' : 'working',
    });
  };

  return (
    <View style={[setRowStyles.row, isLogged && setRowStyles.rowLogged]}>
      {/* Set badge */}
      <View style={[setRowStyles.badge, isLogged && setRowStyles.badgeLogged, isWarmup && setRowStyles.badgeWarmup]}>
        {isLogged ? (
          <Ionicons name="checkmark" size={16} color="#fff" />
        ) : (
          <Text style={setRowStyles.badgeText}>{isWarmup ? 'W' : setNum}</Text>
        )}
      </View>

      {/* Reps input */}
      <View style={setRowStyles.inputGroup}>
        <TextInput
          style={[setRowStyles.input, isLogged && setRowStyles.inputLogged]}
          value={displayReps}
          onChangeText={setReps}
          editable={!isLogged}
          keyboardType="number-pad"
          placeholder={`${repMin}`}
          placeholderTextColor="rgba(255,255,255,0.2)"
          returnKeyType="done"
        />
      </View>

      {/* Weight input */}
      <View style={setRowStyles.inputGroup}>
        <TextInput
          style={[setRowStyles.input, isLogged && setRowStyles.inputLogged]}
          value={displayWeight}
          onChangeText={setWeight}
          editable={!isLogged}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.2)"
          returnKeyType="done"
          onSubmitEditing={handleLog}
        />
      </View>

      {/* Log / done indicator */}
      <TouchableOpacity
        style={setRowStyles.logCheck}
        onPress={handleLog}
        disabled={isLogged}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isLogged ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={28}
          color={isLogged ? colors.success : 'rgba(255,255,255,0.2)'}
        />
      </TouchableOpacity>
    </View>
  );
}

const setRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowLogged: {},
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLogged: { backgroundColor: '#10B981' },
  badgeWarmup: { backgroundColor: 'rgba(255,255,255,0.06)' },
  badgeText: { color: colors.textMuted, fontSize: 14, fontWeight: '800' },
  inputGroup: { flex: 1 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: 'center',
  },
  inputLogged: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.04)',
    color: colors.textMuted,
  },
  logCheck: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── RestTimerSheet ───────────────────────────────────────────────────────────

function RestTimerSheet({
  visible,
  timeLeft,
  onSkip,
  onAdjust,
  onPauseToggle,
  isPaused,
}: {
  visible: boolean;
  timeLeft: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
  onPauseToggle: () => void;
  isPaused: boolean;
}) {
  if (!visible) return null;

  return (
    <View style={restStyles.container}>
      <View style={restStyles.sheet}>
        <View style={restStyles.header}>
          <Text style={restStyles.title}>Rest</Text>
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={restStyles.timerRow}>
          <TouchableOpacity onPress={() => onAdjust(-10)} style={restStyles.adjustBtn}>
            <Ionicons name="timer-outline" size={24} color={colors.textMuted} />
            <Text style={restStyles.adjustLabel}>-10</Text>
          </TouchableOpacity>

          <Text style={restStyles.time}>{fmtTime(timeLeft)}</Text>

          <TouchableOpacity onPress={() => onAdjust(10)} style={restStyles.adjustBtn}>
            <Ionicons name="timer-outline" size={24} color={colors.textMuted} />
            <Text style={restStyles.adjustLabel}>+10</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onPauseToggle} style={restStyles.pauseBtn}>
          <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color={colors.brandPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const restStyles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  sheet: {
    backgroundColor: '#1C1C28',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, marginBottom: 24 },
  adjustBtn: { alignItems: 'center', gap: 4 },
  adjustLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  time: { fontSize: 64, fontWeight: '900', color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  pauseBtn: { alignSelf: 'center', padding: 12 },
});

// ─── FinishModal ──────────────────────────────────────────────────────────────

function FinishModal({
  visible,
  elapsed,
  exercises,
  loggedSets,
  syncPrefs,
  onSyncChange,
  onResume,
  onLog,
}: {
  visible: boolean;
  elapsed: number;
  exercises: WorkoutExercise[];
  loggedSets: Record<string, LoggedSet[]>;
  syncPrefs: { appleHealth: boolean; strava: boolean; fitbit: boolean };
  onSyncChange: (key: 'appleHealth' | 'strava' | 'fitbit', val: boolean) => void;
  onResume: () => void;
  onLog: () => void;
}) {
  const totalVolume = useMemo(() => {
    let v = 0;
    Object.values(loggedSets).forEach(sets => sets.forEach(s => {
      const w = parseFloat(s.weight); const r = parseInt(s.reps, 10);
      if (!isNaN(w) && !isNaN(r)) v += w * r;
    }));
    return v;
  }, [loggedSets]);

  const totalSets = Object.values(loggedSets).flat().length;
  const cals = Math.floor(elapsed / 12);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={finishStyles.overlay}>
        <View style={finishStyles.topFade}>
          <TouchableOpacity style={finishStyles.closeTop} onPress={onResume}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={finishStyles.elapsedTime}>{fmtTime(elapsed)}</Text>

          <ScrollView style={finishStyles.exerciseScroll} showsVerticalScrollIndicator={false}>
            {exercises.map(ex => {
              const sets = loggedSets[ex.id] ?? [];
              return (
                <View key={ex.id} style={finishStyles.exCard}>
                  <View style={finishStyles.exThumb}>
                    {ex.mediaUrl ? (
                      <Image source={{ uri: ex.mediaUrl }} style={finishStyles.exThumbImg} />
                    ) : (
                      <View style={finishStyles.exThumbPlaceholder}>
                        <Ionicons name="barbell-outline" size={20} color={colors.textMuted} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={finishStyles.focusLabel}>FOCUS EXERCISE</Text>
                    <Text style={finishStyles.exName}>{ex.name}</Text>
                    <Text style={finishStyles.exMeta}>{sets.length}/{ex.sets} logged</Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={finishStyles.bottomPanel}>
          <View style={finishStyles.accentLine} />

          <View style={finishStyles.headerRow}>
            <Text style={finishStyles.finishHeading}>Finish and log your workout?</Text>
            <TouchableOpacity>
              <Ionicons name="help-circle-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={finishStyles.statsRow}>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>DURATION</Text>
              <Text style={finishStyles.statValue}>{fmtTime(elapsed)}</Text>
            </View>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>EXERCISES</Text>
              <Text style={finishStyles.statValue}>{exercises.length}</Text>
            </View>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>VOLUME</Text>
              <Text style={finishStyles.statValue}>{totalVolume.toLocaleString()} lb</Text>
            </View>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>CALORIES</Text>
              <Text style={finishStyles.statValue}>{cals} kcal</Text>
            </View>
          </View>

          <View style={finishStyles.syncSection}>
            <View style={finishStyles.syncRow}>
              <Ionicons name="heart" size={20} color="#FF2D55" />
              <Text style={finishStyles.syncLabel}>Sync to Apple Health</Text>
              <Switch
                value={syncPrefs.appleHealth}
                onValueChange={v => onSyncChange('appleHealth', v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,194,255,0.3)' }}
                thumbColor={syncPrefs.appleHealth ? colors.brandPrimary : '#555'}
              />
            </View>
            <View style={finishStyles.syncRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FC4C02" />
              <Text style={finishStyles.syncLabel}>Post to Strava</Text>
              <Switch
                value={syncPrefs.strava}
                onValueChange={v => onSyncChange('strava', v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,194,255,0.3)' }}
                thumbColor={syncPrefs.strava ? colors.brandPrimary : '#555'}
              />
            </View>
            <View style={finishStyles.syncRow}>
              <Ionicons name="fitness" size={20} color="#00B0B9" />
              <Text style={finishStyles.syncLabel}>Post to Fitbit</Text>
              <Switch
                value={syncPrefs.fitbit}
                onValueChange={v => onSyncChange('fitbit', v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,194,255,0.3)' }}
                thumbColor={syncPrefs.fitbit ? colors.brandPrimary : '#555'}
              />
            </View>
          </View>

          <View style={finishStyles.actions}>
            <TouchableOpacity style={finishStyles.resumeBtn} onPress={onResume}>
              <Text style={finishStyles.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={finishStyles.logBtn} onPress={onLog}>
              <Text style={finishStyles.logBtnText}>Log Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const finishStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  topFade: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  closeTop: { position: 'absolute', right: 20, top: 60, zIndex: 10 },
  elapsedTime: { fontSize: 28, fontWeight: '800', color: 'rgba(0, 194, 255, 0.5)', textAlign: 'center', marginBottom: 24 },
  exerciseScroll: { flex: 1 },
  exCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  exThumb: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  exThumbImg: { width: '100%', height: '100%' },
  exThumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  focusLabel: { fontSize: 10, fontWeight: '800', color: colors.brandPrimary, letterSpacing: 1 },
  exName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  exMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bottomPanel: {
    backgroundColor: '#111118',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  accentLine: { height: 3, backgroundColor: colors.brandPrimary, marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  finishHeading: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  statCell: { alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  syncSection: { gap: 2, marginBottom: 24 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  syncLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: 12 },
  resumeBtn: { flex: 1, paddingVertical: 18, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  resumeBtnText: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  logBtn: { flex: 1.5, paddingVertical: 18, borderRadius: 14, backgroundColor: colors.brandPrimary, alignItems: 'center' },
  logBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

// ─── ExerciseImage ────────────────────────────────────────────────────────────
// Wrapper around Image that falls back to the barbell placeholder on load error.

function ExerciseImage({ uri, style }: { uri: string | null | undefined; style: any }) {
  const [failed, setFailed] = useState(false);

  // Pre-process URI: handle relative paths (e.g. from wger)
  let finalUri = uri;
  if (finalUri && finalUri.startsWith('/media/')) {
    finalUri = `https://wger.de${finalUri}`;
  }

  if (!finalUri || failed) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }]}>
        <Ionicons name="barbell-outline" size={32} color="rgba(255,255,255,0.15)" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: finalUri }}
      style={style}
      resizeMode="cover"
      onError={(error) => {
        console.warn(`[WorkoutScreen] Image failed to load: ${finalUri}`, error);
        setFailed(true);
      }}
    />
  );
}

// ─── WorkoutState type ────────────────────────────────────────────────────────

type WorkoutState = 'loading' | 'idle' | 'active' | 'saving' | 'completed' | 'streak' | 'error' | 'rest' | 'no-program';

// ─── Background gradient ──────────────────────────────────────────────────────

function Background() {
  return <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SessionStackParamList, 'WorkoutMain'>>();
  const [screenState, setScreenState] = useState<WorkoutState>('loading');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [workout, setWorkout] = useState<TodayWorkout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rest timer
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null);
  const [restPaused, setRestPaused] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SEC);

  // Set type toggle
  const [setTabMode, setSetTabMode] = useState<'working' | 'warmup'>('working');

  // Exercise picker
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // Finish modal
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Exercise options sheet
  const [optionsExercise, setOptionsExercise] = useState<WorkoutExercise | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Tooltip
  const [showTooltip, setShowTooltip] = useState(false);

  // Swap workout sheet
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [currentWeekDays, setCurrentWeekDays] = useState<any[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync
  const [syncPrefs, setSyncPrefs] = useState({ appleHealth: false, strava: false, fitbit: false });

  // Weekly progress for StreakScreen — fetched from analytics after workout completion
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [completedThisWeek, setCompletedThisWeek] = useState(1);

  // Check tooltip on mount
  useEffect(() => {
    AsyncStorage.getItem(TOOLTIP_KEY).then(val => {
      if (!val) setShowTooltip(true);
    });
  }, []);

  const dismissTooltip = async () => {
    await AsyncStorage.setItem(TOOLTIP_KEY, 'dismissed');
    setShowTooltip(false);
  };

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'active' || !startTime) return;
    const iv = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [screenState, startTime]);

  // ── Rest timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (restTimeLeft === null || restTimeLeft <= 0 || restPaused) return;
    const iv = setInterval(() => {
      setRestTimeLeft(p => {
        if (p !== null && p > 0) return p - 1;
        return null;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [restTimeLeft, restPaused]);

  useEffect(() => {
    if (restTimeLeft === 0) setRestTimeLeft(null);
  }, [restTimeLeft]);

  // ── Persist session ────────────────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'active' || !workout?.workoutDay || !startTime || !activeSession) return;
    saveSession({
      sessionId: activeSession.sessionId,
      workoutDayId: workout.workoutDay.id,
      startTimeISO: startTime.toISOString(),
      exercises,
      sessionExercises: activeSession.exercises,
      loggedSets,
      elapsedSec,
    });
  }, [loggedSets, elapsedSec]);

  // ── Load workout ───────────────────────────────────────────────────────────
  const loadWorkout = useCallback(async () => {
    setScreenState('loading');
    try {
      const res = await api.workouts.today();
      if (!res.success) {
        setErrorMessage(res.error ?? 'Failed to connect');
        setScreenState('error');
        return;
      }
      const data = res.data as TodayWorkout | null;
      if (!data || !data.program) {
        setScreenState('no-program');
        return;
      }
      if (!data.workoutDay || data.workoutDay.phase === 'Rest') {
        setScreenState('rest');
        return;
      }
      setWorkout(data);
      const mapped = mapToExercises(data);
      setExercises(mapped);

      // Fetch all days in the current week for the swap sheet
      fetchWeekDays(data.program.id, data.currentWeek.absoluteWeekNumber);

      const saved = await loadSession();
      if (saved && saved.workoutDayId === data.workoutDay.id) {
        Alert.alert('Resume Session?', 'Continue from where you left off?', [
          { text: 'Fresh Start', style: 'destructive', onPress: () => { clearSession(); setScreenState('idle'); } },
          { text: 'Resume', onPress: () => {
            setLoggedSets(saved.loggedSets);
            setElapsedSec(saved.elapsedSec);
            setStartTime(new Date(saved.startTimeISO));
            setExercises(saved.exercises);
            setActiveSession({
              sessionId: saved.sessionId,
              workoutDayId: saved.workoutDayId,
              exercises: saved.sessionExercises ?? [],
            });
            setScreenState('active');
          }},
        ]);
      } else {
        setScreenState('idle');
      }
    } catch {
      setErrorMessage('Server unreachable');
      setScreenState('error');
    }
  }, []);

  useEffect(() => { loadWorkout(); }, [loadWorkout]);

  const fetchWeekDays = async (programId: string, absoluteWeek: number) => {
    setLoadingWeek(true);
    try {
      const res = await api.programs.getWeeks(programId);
      if (res.success && res.data?.weeks) {
        const week = (res.data.weeks as any[]).find(w => w.absoluteWeekNumber === absoluteWeek);
        if (week?.workoutDays) {
          setCurrentWeekDays(week.workoutDays);
        }
      }
    } catch (err) {
      console.error('[WorkoutScreen] Failed to fetch week days:', err);
    } finally {
      setLoadingWeek(false);
    }
  };

  async function startWorkout() {
    if (!workout?.workoutDay) return;
    setScreenState('loading');
    try {
      const res = await api.request<{ session: { id: string }; sessionExercises: any[] }>('POST', '/api/workouts/session/start', {
        workoutDayId: workout.workoutDay.id,
      });
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to start');
      setActiveSession({
        sessionId: res.data.session.id,
        workoutDayId: workout.workoutDay.id,
        exercises: res.data.sessionExercises,
      });
      setStartTime(new Date());
      setLoggedSets({});
      setExpandedIdx(0);
      setElapsedSec(0);
      setScreenState('active');
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setScreenState('idle');
    }
  }

  async function logSet(exId: string, setNum: number, data: any, repMin: number, repMax: number) {
    if (!activeSession) return;
    // Find the session exercise by exerciseId. If the session exercise isn't found
    // (e.g. exercise was added mid-session), skip the backend log gracefully.
    const sessionEx = activeSession.exercises.find(
      (e: { exerciseId: string; id: string }) => e.exerciseId === exId
    );
    const status = calculateStatus(parseInt(data.reps, 10), repMin, repMax);
    const exercise = exercises.find(e => e.id === exId);
    const unit = exercise?.weightUnit ?? 'kg';
    try {
      if (sessionEx) {
        await api.request('POST', `/api/workouts/session/exercises/${sessionEx.id}/sets`, {
          setType: data.setType,
          setOrder: setNum,
          actualReps: parseInt(data.reps, 10),
          actualWeight: parseFloat(data.weight),
          rir: parseInt(data.rir, 10),
          unit,
          completed: true,
        });
      }
      setLoggedSets(prev => {
        const existing = prev[exId] ?? [];
        return { ...prev, [exId]: [...existing.filter(s => s.setNumber !== setNum), { setNumber: setNum, ...data, status }] };
      });
      setRestTimeLeft(restDuration);
      setRestPaused(false);
    } catch (err: any) {
      Alert.alert('Log Failed', err.message);
    }
  }

  async function submitWorkout() {
    setScreenState('saving');
    setShowFinishModal(false);
    try {
      for (const ex of exercises) {
        const sets = loggedSets[ex.id];
        if (!sets?.length) continue;
        // Use the heaviest working-set weight for the log entry
        const workingSets = sets.filter(s => s.setType !== 'warmup');
        const targetSets = workingSets.length > 0 ? workingSets : sets;
        const maxWeight = Math.max(...targetSets.map(s => parseFloat(s.weight) || 0));
        const avgRir = targetSets.length > 0
          ? Math.round(targetSets.reduce((acc, s) => acc + (parseInt(s.rir, 10) || 0), 0) / targetSets.length)
          : undefined;
        const payload: any = {
          exerciseId: ex.id,
          sessionDate: new Date().toISOString().split('T')[0],
          weight: maxWeight,
          weightUnit: ex.weightUnit ?? 'kg',
          programId: workout?.program?.id,
          workoutDayId: workout?.workoutDay?.id,
          exercisePrescriptionId: ex.prescriptionId || undefined,
          rir: avgRir,
        };
        // Only log working sets in the reps slots (up to 4)
        targetSets.forEach((s, i) => { if (i < 4) payload[`set${i+1}Reps`] = parseInt(s.reps, 10) || 0; });
        await api.request('POST', '/api/training-log', payload);
      }
      if (activeSession) {
        await api.request('POST', '/api/workouts/session/finish', {
          sessionId: activeSession.sessionId,
          syncToAppleHealth: syncPrefs.appleHealth,
          postToStrava: syncPrefs.strava,
          postToFitbit: syncPrefs.fitbit,
        });
      }
      await clearSession();

      // Fetch data to populate StreakScreen with real weekly progress
      try {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startDateStr = startOfWeek.toISOString().split('T')[0];

        const [historyRes, profileRes] = await Promise.allSettled([
          api.trainingLog.history({ limit: 50, start_date: startDateStr }),
          api.request<{ workoutsPerWeek?: number }>('GET', '/api/profiles/onboarding'),
        ]);

        if (historyRes.status === 'fulfilled' && historyRes.value.success && historyRes.value.data) {
          const logs = (historyRes.value.data as any).logs as Array<{ sessionDate: string }>;
          const uniqueDays = new Set(logs.map(l => l.sessionDate)).size;
          // Include the session we just finished (it may not appear yet due to timing)
          setCompletedThisWeek(Math.max(uniqueDays, 1));
        }
        if (profileRes.status === 'fulfilled' && profileRes.value.success && profileRes.value.data) {
          const goal = (profileRes.value.data as any).workoutsPerWeek;
          if (goal && goal > 0) setWeeklyGoal(goal);
        }
      } catch { /* analytics failure does not block the completion flow */ }

      setScreenState('completed');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
      setScreenState('active');
    }
  }

  const totalLogged = Object.values(loggedSets).flat().length;
  const workoutName = workout?.workoutDay?.workoutType ?? 'Workout';
  const phaseText = workout?.workoutDay?.phase ?? '';
  const weekNum = workout?.currentWeek?.absoluteWeekNumber ?? 1;
  const totalMuscles = [...new Set(exercises.map(e => e.muscle).filter(Boolean))].length;

  // ═══ Loading ═══════════════════════════════════════════════════════════════
  if (screenState === 'loading' || screenState === 'saving') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </SafeAreaView>
      </View>
    );
  }

  // ═══ Error ══════════════════════════════════════════════════════════════════
  if (screenState === 'error') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <Text style={ms.errorTitle}>Connection error</Text>
          <Text style={ms.errorSub}>{errorMessage}</Text>
          <TouchableOpacity style={ms.retryBtn} onPress={loadWorkout}><Text style={ms.retryBtnText}>RETRY</Text></TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ═══ No Program ════════════════════════════════════════════════════════════
  if (screenState === 'no-program') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0, 194, 255, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="barbell-outline" size={36} color={colors.brandPrimary} />
          </View>
          <Text style={ms.restDayTitle}>No Program Yet</Text>
          <Text style={ms.restDaySub}>Generate a training program from the Home tab{'\n'}to start your workouts.</Text>
          <TouchableOpacity style={ms.primaryBtn} onPress={() => setShowExercisePicker(true)}>
            <Text style={ms.primaryBtnText}>QUICK WORKOUT</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={(ex) => {
            setExercises(prev => [...prev, {
              id: ex.id, prescriptionId: '', name: ex.name,
              muscle: ex.bodyPart, sets: DEFAULT_SETS, repMin: 8, repMax: 12,
              rirTarget: 2, suggestedWeight: 0, weightUnit: 'kg', mediaUrl: ex.mediaUrl,
            }]);
            if (exercises.length === 0) setScreenState('idle');
          }}
        />
      </View>
    );
  }

  // ═══ Rest Day ══════════════════════════════════════════════════════════════
  if (screenState === 'rest') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <Text style={{ fontSize: 60, marginBottom: 20 }}>🌙</Text>
          <Text style={ms.restDayTitle}>Recovery Protocol</Text>
          <Text style={ms.restDaySub}>Rest is where the growth happens. See you tomorrow.</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ═══ Streak Screen ══════════════════════════════════════════════════════════
  if (screenState === 'streak') {
    return (
      <StreakScreen
        weeklyGoal={weeklyGoal}
        completedThisWeek={completedThisWeek}
        onContinue={() => {
          setScreenState('idle');
          loadWorkout();
        }}
      />
    );
  }

  // ═══ Completed ══════════════════════════════════════════════════════════════
  if (screenState === 'completed') {
    return (
      <WorkoutCompleteScreen
        exercises={exercises}
        loggedSets={loggedSets}
        elapsedSec={elapsedSec}
        onShare={() => Alert.alert('Share', 'Sharing coming soon!')}
        onDone={() => setScreenState('streak')}
      />
    );
  }

  // ═══ Idle (Preview / Day Overview) ════════════════════════════════════════
  if (screenState === 'idle') {
    return (
      <View style={ms.container}>
        <Background />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={ms.idleScroll}
          >
            {/* Top breadcrumb */}
            <View style={ms.breadcrumb}>
              <View style={ms.avatarCircle}>
                <Text style={ms.avatarText}>LD</Text>
              </View>
              <TouchableOpacity style={ms.breadcrumbPill}>
                <Text style={ms.breadcrumbText}>My Plan </Text>
                <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Workout title row */}
            <View style={ms.workoutTitleRow}>
              <Text style={ms.workoutTitle}><Text style={{ fontStyle: 'italic', fontWeight: '900' }}>{workoutName}</Text></Text>
              <TouchableOpacity style={ms.swapPill} onPress={() => setShowSwapSheet(true)}>
                <Ionicons name="swap-horizontal" size={14} color={colors.brandPrimary} />
                <Text style={[ms.swapText, { color: colors.brandPrimary }]}> Swap</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.dotBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={ms.workoutSubtitle}>
              {exercises.length} {exercises.length === 1 ? 'Exercise' : 'Exercises'} · {totalMuscles || 1} {totalMuscles === 1 ? 'Muscle' : 'Muscles'}
            </Text>

            {/* Filter chips */}
            <View style={ms.filterRow}>
              <TouchableOpacity style={ms.filterChip}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={ms.filterChipText}> 1h 15m</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={ms.filterChip}>
                <Text style={ms.filterChipText}>Equipment</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Exercise list */}
            <View style={ms.exerciseList}>
              {exercises.map((ex, idx) => (
                <View key={ex.id} style={ms.exListItem}>
                  {/* Vertical connector line */}
                  {idx < exercises.length - 1 && <View style={ms.connectorLine} />}

                  {/* Exercise row */}
                  <View style={ms.exRow}>
                    {/* Full square thumbnail with muscle overlay */}
                    <View style={ms.exThumb}>
                      {ex.mediaUrl ? (
                        <ExerciseImage uri={ex.mediaUrl} style={StyleSheet.absoluteFill} />
                      ) : (
                        <Ionicons name="barbell-outline" size={24} color={colors.textMuted} />
                      )}
                      {/* Muscle silhouette badge in corner */}
                      <View style={ms.exThumbMuscleOverlay}>
                        <Ionicons name="body-outline" size={14} color="rgba(255,255,255,0.5)" />
                      </View>
                    </View>

                    {/* Exercise info */}
                    <View style={{ flex: 1 }}>
                      {idx === 0 && (
                        <Text style={ms.focusLabel}>FOCUS EXERCISE</Text>
                      )}
                      <Text style={ms.exName}>{ex.name}</Text>
                      <Text style={ms.exMeta}>
                        {ex.sets} sets · {ex.repMin}{ex.repMax !== ex.repMin ? `-${ex.repMax}` : ''} reps
                        {ex.suggestedWeight > 0 ? ` · ${ex.suggestedWeight} lb` : ''}
                      </Text>
                    </View>

                    {/* Options button + tooltip anchor */}
                    <View>
                      <TouchableOpacity
                        style={ms.exOptionsBtn}
                        onPress={() => { setOptionsExercise(ex); setShowOptions(true); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                      {idx === 0 && showTooltip && (
                        <ExerciseTooltip visible={showTooltip} onDismiss={dismissTooltip} />
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {/* Add Exercise */}
              <TouchableOpacity style={ms.addExerciseRow} onPress={() => { console.log('[WorkoutScreen] Add Exercise pressed'); setShowExercisePicker(true); }}>
                <View style={ms.addExerciseIcon}>
                  <Ionicons name="add" size={20} color={colors.brandPrimary} />
                </View>
                <Text style={ms.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Start Workout CTA */}
          <View style={ms.idleBottomBar}>
            <TouchableOpacity style={ms.startWorkoutBtn} onPress={startWorkout}>
              <Text style={ms.startWorkoutBtnText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Exercise options sheet */}
        <ExerciseOptionsSheet
          visible={showOptions}
          exercise={optionsExercise}
          onClose={() => setShowOptions(false)}
          onDelete={() => {
            if (optionsExercise) {
              setExercises(prev => prev.filter(e => e.id !== optionsExercise.id));
            }
          }}
          onReplace={() => setShowExercisePicker(true)}
        />

        <SwapWorkoutSheet
          visible={showSwapSheet}
          onClose={() => setShowSwapSheet(false)}
          currentWorkoutDayId={workout?.workoutDay?.id}
          splitDays={currentWeekDays}
          onSelectDay={async (day) => {
            console.log('[Swap] Option tapped:', day.id);
            
            // 1. Close the swap sheet first
            setShowSwapSheet(false);
            
            // 2. Wait a small gap to let the first modal start its dismissal.
            // This prevents modal mount/unmount conflicts in React Native.
            await new Promise(resolve => setTimeout(resolve, 200));
            
            console.log('[Swap] Loading state ON');
            setIsGenerating(true);
            
            // 3. Mandatory delay for premium feel
            console.log('[Swap] Workout update starting');
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            try {
              // Persist the swap on the backend
              await api.request('POST', '/api/workouts/swap', { workoutDayId: day.id });
              
              setWorkout(prev => prev ? { ...prev, workoutDay: day } : null);
              setExercises(mapToExercises({ ...workout!, workoutDay: day }));
              console.log('[Swap] Workout update complete');
            } catch (err) {
              console.error('[Swap] Workout update failed:', err);
            } finally {
              setIsGenerating(false);
              console.log('[Swap] Loading state OFF');
            }
          }}
          onPickMuscles={() => navigation.navigate('MuscleSelection')}
          onCreateCustom={() => navigation.navigate('ExerciseSelection', { params: {} } as any)}
        />

        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={(ex) => {
            setExercises(prev => [...prev, {
              id: ex.id, prescriptionId: '', name: ex.name,
              muscle: ex.bodyPart, sets: DEFAULT_SETS, repMin: 8, repMax: 12,
              rirTarget: 2, suggestedWeight: 0, weightUnit: 'kg', mediaUrl: ex.mediaUrl,
            }]);
          }}
        />
      </View>
    );
  }

  // ═══ Active Workout ═════════════════════════════════════════════════════════

  const currentEx = exercises[expandedIdx] ?? exercises[0];
  const currentLogged = loggedSets[currentEx?.id] ?? [];
  const currentComplete = currentLogged.length >= (currentEx?.sets ?? 0);

  return (
    <View style={ms.container}>
      <Background />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* ── Exercise image/header area ─────────────── */}
        <View style={ms.exDetailHeader}>
          {currentEx?.mediaUrl ? (
            <ExerciseImage uri={currentEx.mediaUrl} style={ms.exImage} />
          ) : (
            <View style={ms.exImagePlaceholder}>
              <Ionicons name="barbell-outline" size={48} color="rgba(255,255,255,0.15)" />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.85)']}
            style={ms.exHeaderGradient}
          >
            <Text style={ms.exHeaderName} numberOfLines={1}>{currentEx?.name ?? ''}</Text>
            {currentEx?.muscle ? (
              <Text style={ms.exHeaderMuscle}>{currentEx.muscle}</Text>
            ) : null}
          </LinearGradient>

          <TouchableOpacity style={ms.closeBtn} onPress={() => setShowFinishModal(true)}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Exercise navigation pills */}
          <View style={ms.exNavPills}>
            {exercises.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setExpandedIdx(i)} style={[ms.navPill, i === expandedIdx && ms.navPillActive]} />
            ))}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* ── Working / Warm-up tabs ───────────────── */}
          <View style={ms.setTabRow}>
            <TouchableOpacity
              style={[ms.setTab, setTabMode === 'working' && ms.setTabActive]}
              onPress={() => setSetTabMode('working')}
            >
              <Text style={[ms.setTabText, setTabMode === 'working' && ms.setTabTextActive]}>Working Sets</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.setTab, setTabMode === 'warmup' && ms.setTabActive]}
              onPress={() => setSetTabMode('warmup')}
            >
              <Text style={[ms.setTabText, setTabMode === 'warmup' && ms.setTabTextActive]}>Warm-up Sets</Text>
            </TouchableOpacity>
          </View>

          {/* ── Rest timer inline toggle ─────────────── */}
          <View style={ms.restTimerToggleRow}>
            <Ionicons name="timer-outline" size={20} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={ms.restTimerLabel}>Rest Timer</Text>
              <Text style={ms.restTimerSub}>Between Sets</Text>
            </View>
            <Switch
              value={restDuration > 0}
              onValueChange={v => setRestDuration(v ? DEFAULT_REST_SEC : 0)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0, 194, 255, 0.3)' }}
              thumbColor={restDuration > 0 ? colors.brandPrimary : '#555'}
            />
          </View>

          {/* ── Rest time selector ────────────────────── */}
          {restDuration > 0 && (
            <View style={ms.restPickerRow}>
              <TouchableOpacity onPress={() => setRestDuration(d => Math.max(10, d - 10))} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.3 }]}>{fmtTime(Math.max(10, restDuration - 10))}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRestDuration(d => Math.max(10, d - 5))} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.5 }]}>{fmtTime(Math.max(10, restDuration - 5))}</Text>
              </TouchableOpacity>
              <View style={ms.restPickerHighlight}>
                <Text style={ms.restPickerTimeActive}>{fmtTime(restDuration)}</Text>
              </View>
              <TouchableOpacity onPress={() => setRestDuration(d => d + 5)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.5 }]}>{fmtTime(restDuration + 5)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRestDuration(d => d + 10)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.3 }]}>{fmtTime(restDuration + 10)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Phase info ────────────────────────────── */}
          <View style={ms.phaseInfo}>
            <View style={ms.phaseIcon}><Text style={{ fontSize: 22 }}>✨</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={ms.phaseTitle}>Phase {weekNum} of 4: {phaseText || 'Building Momentum'}</Text>
              <Text style={ms.phaseSub}>Today should feel challenging but controlled. Focus on form and move with intent.</Text>
            </View>
          </View>
          <Text style={ms.adjustNote}>Adjust weights if necessary.</Text>

          {/* ── Set header ─────────────────────────────── */}
          <View style={ms.setHeaderRow}>
            <View style={{ width: 32 }} />
            <Text style={[ms.setHeaderLabel, { flex: 1 }]}>
              {setTabMode === 'warmup' ? 'Warm-up Reps' : 'Reps'}
            </Text>
            <Text style={[ms.setHeaderLabel, { flex: 1 }]}>Weight ({currentEx?.weightUnit ?? 'kg'})</Text>
          </View>

          {/* ── Set rows ───────────────────────────────── */}
          {currentEx && Array.from({ length: currentEx.sets }).map((_, si) => {
            const num = si + 1;
            const log = currentLogged.find(s => s.setNumber === num);
            const isWarmup = setTabMode === 'warmup' && si === 0;
            return (
              <View key={num} style={ms.setRowContainer}>
                <SetInputRow
                  setNum={num}
                  isWarmup={isWarmup}
                  repMin={currentEx.repMin}
                  repMax={currentEx.repMax}
                  rirTarget={currentEx.rirTarget}
                  suggestedWeight={currentEx.suggestedWeight}
                  loggedSet={log}
                  onLog={(data) => logSet(currentEx.id, num, data, currentEx.repMin, currentEx.repMax)}
                />
              </View>
            );
          })}

          {/* ── Add Set ────────────────────────────────── */}
          <TouchableOpacity style={ms.addSetRow} onPress={() => {
            if (!currentEx) return;
            setExercises(prev => prev.map(e => e.id === currentEx.id ? { ...e, sets: e.sets + 1 } : e));
          }}>
            <View style={ms.addSetIcon}><Ionicons name="add" size={18} color={colors.brandPrimary} /></View>
            <Text style={ms.addSetText}>Add Set</Text>
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* ── Bottom action buttons ────────────────── */}
        <View style={ms.bottomActions}>
          <TouchableOpacity style={ms.startBtn} onPress={() => {
            setRestTimeLeft(restDuration > 0 ? restDuration : DEFAULT_REST_SEC);
            setRestPaused(false);
          }}>
            <Ionicons name="play" size={16} color={colors.textPrimary} style={{ marginBottom: 2 }} />
            <Text style={ms.startBtnText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ms.logSetBtn, currentComplete && ms.logSetBtnDone]}
            onPress={() => {
              if (!currentEx) return;
              const nextUnlogged = Array.from({ length: currentEx.sets }).findIndex((_, i) => !currentLogged.find(s => s.setNumber === i + 1));
              if (nextUnlogged === -1) {
                if (expandedIdx < exercises.length - 1) setExpandedIdx(expandedIdx + 1);
                return;
              }
              const setNum = nextUnlogged + 1;
              logSet(currentEx.id, setNum, {
                weight: currentEx.suggestedWeight > 0 ? currentEx.suggestedWeight.toString() : '100',
                reps: currentEx.repMin.toString(),
                rir: currentEx.rirTarget.toString(),
                setType: setTabMode,
              }, currentEx.repMin, currentEx.repMax);
            }}
          >
            <Text style={ms.logSetBtnText}>
              {currentComplete ? 'Next Exercise' : `Log Set ${currentLogged.length + 1}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Rest timer bottom sheet ──────────────── */}
        <RestTimerSheet
          visible={restTimeLeft !== null && restTimeLeft > 0}
          timeLeft={restTimeLeft ?? 0}
          onSkip={() => setRestTimeLeft(null)}
          onAdjust={(delta) => setRestTimeLeft(p => Math.max(0, (p ?? 0) + delta))}
          onPauseToggle={() => setRestPaused(p => !p)}
          isPaused={restPaused}
        />

        {/* ── Finish modal ─────────────────────────── */}
        <FinishModal
          visible={showFinishModal}
          elapsed={elapsedSec}
          exercises={exercises}
          loggedSets={loggedSets}
          syncPrefs={syncPrefs}
          onSyncChange={(k, v) => setSyncPrefs(p => ({ ...p, [k]: v }))}
          onResume={() => setShowFinishModal(false)}
          onLog={submitWorkout}
        />

        {/* ── Exercise picker ──────────────────────── */}
        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={async (ex) => {
            const newExercise: WorkoutExercise = {
              id: ex.id, prescriptionId: '', name: ex.name,
              muscle: ex.bodyPart, sets: DEFAULT_SETS, repMin: 8, repMax: 12,
              rirTarget: 2, suggestedWeight: 0, weightUnit: 'kg', mediaUrl: ex.mediaUrl,
            };
            setExercises(prev => [...prev, newExercise]);
            // Register the exercise with the active session so its sets are tracked on the backend
            if (activeSession?.sessionId) {
              try {
                const res = await api.workouts.addSessionExercise({
                  sessionId: activeSession.sessionId,
                  exerciseId: ex.id,
                  orderIndex: exercises.length,
                });
                if (res.success && res.data) {
                  const sessionEx = (res.data as any).sessionExercise ?? res.data;
                  setActiveSession(prev => prev
                    ? { ...prev, exercises: [...prev.exercises, { id: sessionEx.id, exerciseId: ex.id, orderIndex: exercises.length }] }
                    : prev
                  );
                }
              } catch { /* non-fatal — set falls back to local-only storage */ }
            }
          }}
        />
        <GeneratingWorkoutModal visible={isGenerating} />
      </SafeAreaView>
    </View>
  );
}

// ─── Main styles ──────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  container: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  errorSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  retryBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.brandPrimary },
  retryBtnText: { color: '#fff', fontWeight: '900' },
  restDayTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  restDaySub: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 24 },
  primaryBtn: { backgroundColor: colors.brandPrimary, paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 24, paddingHorizontal: 32 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },

  // ── Idle state ──
  idleScroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  breadcrumbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
  },
  breadcrumbText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },

  workoutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  workoutTitle: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, flex: 1 },
  swapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
  },
  swapText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  dotBtn: { padding: 4 },

  workoutSubtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    gap: 4,
  },
  filterChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },

  exerciseList: { gap: 0 },
  exListItem: { position: 'relative' },
  connectorLine: {
    position: 'absolute',
    left: 36,
    top: 84,
    bottom: -4,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 0,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  exThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exThumbMuscleOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusLabel: { fontSize: 10, fontWeight: '800', color: colors.warning, letterSpacing: 1.2, marginBottom: 2 },
  exName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  exMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  exOptionsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  addExerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  addExerciseText: { fontSize: 15, fontWeight: '700', color: colors.brandPrimary },

  idleBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 36,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  startWorkoutBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  startWorkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },

  // ── Active workout ──
  exDetailHeader: { height: 220, backgroundColor: '#0E0E18', position: 'relative' },
  exImage: { width: '100%', height: '100%' },
  exImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E0E18' },
  exHeaderGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 100,
    justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 28,
  },
  exHeaderName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  exHeaderMuscle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  closeBtn: { position: 'absolute', right: 16, top: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  exNavPills: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  navPill: { width: 40, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  navPillActive: { backgroundColor: 'rgba(255,255,255,0.7)' },

  setTabRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 0 },
  setTab: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: 'transparent' },
  setTabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  setTabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  setTabTextActive: { color: colors.textPrimary, fontWeight: '700' },

  restTimerToggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  restTimerLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  restTimerSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  restPickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 16 },
  restPickerTime: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
  restPickerHighlight: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  restPickerTimeActive: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

  phaseInfo: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  phaseIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  phaseTitle: { fontSize: 15, fontWeight: '700', color: colors.warning },
  phaseSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  adjustNote: { paddingHorizontal: 20, paddingBottom: 16, fontSize: 13, color: colors.textMuted },

  setHeaderRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  setHeaderLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },

  setRowContainer: { paddingHorizontal: 20 },

  addSetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  addSetIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  addSetText: { fontSize: 15, fontWeight: '700', color: colors.brandPrimary },

  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  startBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  startBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  logSetBtn: {
    flex: 2,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logSetBtnDone: { backgroundColor: '#10B981' },
  logSetBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
