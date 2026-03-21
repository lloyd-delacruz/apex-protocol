import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useTrainingHistory } from '../../hooks/useWorkout';
import ScreenErrorState from '../../components/ScreenErrorState';
import { useProgress } from '../../hooks/useProgress';
import { useProfile } from '../../hooks/useProfile';

const LOG_TOOLTIP_KEY = 'apex_tooltip_log';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

// ─── LogTooltip ──────────────────────────────────────────────────────────────

function LogTooltip({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  if (!visible) return null;
  return (
    <View style={tooltipStyles.container}>
      <View style={tooltipStyles.box}>
        <Text style={tooltipStyles.title}>Log</Text>
        <Text style={tooltipStyles.body}>
          Track your workout history, view past sessions, and monitor your streaks and milestones here.
        </Text>
        <View style={tooltipStyles.btnRow}>
          <TouchableOpacity>
            <Text style={tooltipStyles.learnMore}>Learn More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tooltipStyles.gotItBtn} onPress={onDismiss}>
            <Text style={tooltipStyles.gotItText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const tooltipStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  box: {
    backgroundColor: '#1E1E30',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  learnMore: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  gotItBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.brandPrimary },
  gotItText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ─── TrialBanner ─────────────────────────────────────────────────────────────

function TrialBanner() {
  return (
    <View style={trialStyles.banner}>
      <Ionicons name="time-outline" size={16} color={colors.warning} />
      <Text style={trialStyles.text}>7 Days Left in Your Trial</Text>
      <TouchableOpacity>
        <Text style={trialStyles.upgrade}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}

const trialStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  text: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.warning },
  upgrade: { fontSize: 13, fontWeight: '700', color: colors.brandPrimary },
});

// ─── MilestoneBadges ──────────────────────────────────────────────────────────

function MilestoneBadges() {
  const badgeColors = [colors.brandPrimary, colors.warning, colors.danger];
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {badgeColors.map((c, i) => (
        <View key={i} style={[milestoneStyles.hex, { borderColor: c, backgroundColor: c + '22' }]}>
          <Ionicons name="trophy-outline" size={10} color={c} />
        </View>
      ))}
    </View>
  );
}

const milestoneStyles = StyleSheet.create({
  hex: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── CalendarView ─────────────────────────────────────────────────────────────

function CalendarView({ workoutDateSet }: { workoutDateSet: Set<number> }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [expanded, setExpanded] = useState(false);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayLabels = ['SU','MO','TU','WE','TH','FR','SA'];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const todayDate = today.getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Workout days come from real training log history for the current month
  const workoutDays = workoutDateSet;

  return (
    <View style={calStyles.container}>
      {/* Header */}
      <View style={calStyles.header}>
        <Text style={calStyles.title}><Text style={{ fontStyle: 'italic' }}>Calendar</Text></Text>
        <TouchableOpacity style={calStyles.monthBtn} onPress={() => setExpanded(e => !e)}>
          <Text style={calStyles.monthText}>{monthNames[month]}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={calStyles.dayRow}>
        {dayLabels.map(d => (
          <View key={d} style={calStyles.dayCell}>
            <Text style={calStyles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Show current week only unless expanded */}
      {(() => {
        const weeks: (number | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) {
          weeks.push(cells.slice(i, i + 7));
        }

        const currentWeekIdx = isCurrentMonth
          ? weeks.findIndex(week => week.includes(todayDate))
          : 0;

        const visibleWeeks = expanded ? weeks : weeks.slice(currentWeekIdx, currentWeekIdx + 1);

        return visibleWeeks.map((week, wi) => (
          <View key={wi} style={calStyles.weekRow}>
            {week.map((day, di) => {
              const isToday = isCurrentMonth && day === todayDate;
              const hasWorkout = day !== null && workoutDays.has(day);
              return (
                <View key={di} style={calStyles.dateCell}>
                  <View style={[calStyles.dateBubble, isToday && calStyles.todayBubble]}>
                    <Text style={[calStyles.dateText, isToday && calStyles.todayText]}>
                      {day ?? ''}
                    </Text>
                  </View>
                  {hasWorkout && <Text style={calStyles.workoutDot}>·</Text>}
                </View>
              );
            })}
          </View>
        ));
      })()}
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  monthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayCell: { flex: 1, alignItems: 'center' },
  dayLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dateCell: { flex: 1, alignItems: 'center' },
  dateBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBubble: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
  },
  dateText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  todayText: { color: colors.textPrimary, fontWeight: '700' },
  workoutDot: { fontSize: 18, color: colors.brandPrimary, marginTop: -4, lineHeight: 14 },
});

// ─── PastWorkoutRow ──────────────────────────────────────────────────────────

interface PastWorkout {
  id: string;
  date: string;
  time: string;
  name: string;
  exercises: number;
  volume: number;
  duration: string;
}

function PastWorkoutRow({ workout }: { workout: PastWorkout }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={pwStyles.container}>
      <TouchableOpacity style={pwStyles.header} onPress={() => setExpanded(e => !e)}>
        <View style={{ flex: 1 }}>
          <Text style={pwStyles.name}>{workout.name}</Text>
          <Text style={pwStyles.meta}>{workout.exercises} exercises · {workout.volume.toLocaleString()} lb · {workout.duration}</Text>
        </View>
        <Text style={pwStyles.time}>{workout.time}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={pwStyles.detail}>
          <Text style={pwStyles.detailText}>Tap exercises to see set details</Text>
        </View>
      )}
    </View>
  );
}

const pwStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 13, color: colors.textMuted, marginRight: 8 },
  detail: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailText: { fontSize: 13, color: colors.textMuted, paddingTop: 10 },
});

// ─── Main LogScreen ───────────────────────────────────────────────────────────

export default function LogScreen() {
  const { user, resetDevelopment } = useAuth();
  const { sessions, loading, error, refresh } = useTrainingHistory(50);
  const { data: analytics } = useProgress();
  const { profile } = useProfile();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleReset = () => {
    Alert.alert(
      'Development Reset',
      'This will clear ALL local storage, tokens, and onboarding state. You will be logged out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset App', style: 'destructive', onPress: resetDevelopment }
      ]
    );
  };

  useEffect(() => {
    AsyncStorage.getItem(LOG_TOOLTIP_KEY).then(val => {
      if (!val) setShowTooltip(true);
    });
  }, []);

  // Derive all display data from raw training history
  const { pastWorkouts, calendarWorkoutDays, workoutsThisWeek, workoutCount } = useMemo(() => {
    const grouped: Record<string, PastWorkout> = {};
    sessions.forEach((log) => {
      const date = log.sessionDate ?? 'Unknown';
      if (!grouped[date]) {
        grouped[date] = {
          id: date,
          date,
          time: '—',
          name: log.workoutDay?.workoutType ?? 'Workout',
          exercises: 0,
          volume: 0,
          duration: '—',
        };
      }
      grouped[date].exercises += 1;
      const reps = (log.set1Reps || 0) + (log.set2Reps || 0) + (log.set3Reps || 0) + (log.set4Reps || 0);
      grouped[date].volume += (log.weight || 0) * reps;
    });

    const sorted = Object.values(grouped)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);

    const today = new Date();
    const dayNumbers = new Set<number>();
    sessions.forEach((log) => {
      if (!log.sessionDate) return;
      const d = new Date(log.sessionDate);
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) {
        dayNumbers.add(d.getDate());
      }
    });

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const thisWeekCount = sorted.filter(w => new Date(w.date) >= startOfWeek).length;

    return {
      pastWorkouts: sorted,
      calendarWorkoutDays: dayNumbers,
      workoutsThisWeek: thisWeekCount,
      workoutCount: sessions.length,
    };
  }, [sessions]);

  const streak = analytics?.adherence?.streak ?? 0;
  const weeklyGoal = profile?.workoutsPerWeek ?? 4;

  const dismissTooltip = async () => {
    await AsyncStorage.setItem(LOG_TOOLTIP_KEY, 'dismissed');
    setShowTooltip(false);
  };

  const today = new Date();

  return (
    <View style={ls.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Top bar ──────────────────────────── */}
        <View style={ls.topBar}>
          <TouchableOpacity style={ls.topBarBtn}>
            <Ionicons name="share-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={ls.topBarTitle}>{user?.name ?? user?.email ?? 'Athlete'}</Text>
          <View style={ls.topBarRight}>
            <TouchableOpacity style={ls.topBarBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.textMuted} />
              <View style={ls.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={ls.topBarBtn}
              onPress={() => Alert.alert('Settings', 'Settings coming soon.')}
              onLongPress={handleReset}
              delayLongPress={2000}
            >
              <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Stats row 1: Workouts + Milestones ── */}
          <View style={ls.statsSection}>
            <View style={ls.statCard}>
              <Text style={ls.statValue}>{workoutCount}</Text>
              <Text style={ls.statLabel}>WORKOUTS</Text>
            </View>
            <View style={ls.statDivider} />
            <View style={ls.statCard}>
              <MilestoneBadges />
              <Text style={[ls.statLabel, { marginTop: 6 }]}>MILESTONES</Text>
            </View>
          </View>

          {/* ── Stats row 2: Weekly Goal + Streak ── */}
          <View style={ls.statsSection}>
            <View style={ls.statCard}>
              <Text style={ls.statValue}>{workoutsThisWeek}/{weeklyGoal} <Text style={ls.statValueSub}>days</Text></Text>
              <Text style={ls.statLabel}>WEEKLY GOAL</Text>
            </View>
            <View style={ls.statDivider} />
            <View style={ls.statCard}>
              <Text style={ls.statValue}>{streak} <Text style={ls.statValueSub}>weeks</Text></Text>
              <Text style={ls.statLabel}>CURRENT STREAK</Text>
            </View>
          </View>

          {/* ── Trial banner ─────────────────────── */}
          <TrialBanner />

          {/* ── Calendar ─────────────────────────── */}
          <CalendarView workoutDateSet={calendarWorkoutDays} />

          {/* ── Past Workouts ─────────────────────── */}
          <View style={ls.sectionHeader}>
            <Text style={ls.sectionTitle}>Past Workouts</Text>
            <TouchableOpacity style={ls.addBtn}>
              <Ionicons name="add" size={20} color={colors.brandPrimary} />
            </TouchableOpacity>
          </View>

          {/* Today row */}
          <View style={ls.todayRow}>
            <Text style={ls.todayLabel}>TODAY</Text>
            <Text style={ls.todayTime}>{today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 24 }} />
          ) : error ? (
            <ScreenErrorState message={error} onRetry={refresh} />
          ) : pastWorkouts.length === 0 ? (
            <View style={ls.emptyState}>
              <Ionicons name="barbell-outline" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={ls.emptyTitle}>No workouts yet</Text>
              <Text style={ls.emptySub}>Complete a workout to see it here</Text>
            </View>
          ) : (
            pastWorkouts.map(w => <PastWorkoutRow key={w.id} workout={w} />)
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Log Tooltip ─────────────────────────── */}
        <LogTooltip visible={showTooltip} onDismiss={dismissTooltip} />
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ls = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  topBarRight: { flexDirection: 'row' },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.background,
  },

  statsSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  statValueSub: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, marginTop: 4 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,194,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  todayLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 1 },
  todayTime: { fontSize: 12, color: colors.textMuted },

  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
