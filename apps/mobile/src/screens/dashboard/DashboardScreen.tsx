import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTodayWorkout, useTrainingHistory } from '../../hooks/useWorkout';
import { useProgress } from '../../hooks/useProgress';
import { useProfile } from '../../hooks/useProfile';

const { width, height } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type DashState = 'loading' | 'no-program' | 'rest' | 'ready' | 'error';

// ─── Components ───────────────────────────────────────────────────────────────

function Pillar({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.pillar} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.pillarLabel}>{label}</Text>
      <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

function ExerciseCard({ 
  exercise, 
  index, 
  isLast, 
  isFocus, 
  onMenuPress 
}: { 
  exercise: any; 
  index: number; 
  isLast: boolean; 
  isFocus: boolean;
  onMenuPress: () => void;
}) {
  return (
    <View style={styles.exerciseCardContainer}>
      {/* Connector Line */}
      {!isLast && <View style={styles.connectorLine} />}
      
      <View style={styles.exerciseCardInner}>
        {/* Thumbnail Section */}
        <View style={styles.thumbnailWrapper}>
          <Image 
            source={{ uri: exercise.exercise.mediaUrl || 'https://via.placeholder.com/150' }} 
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {/* Muscle Badge Overlay */}
          <View style={styles.muscleBadge}>
            <MaterialCommunityIcons 
              name={getMuscleIcon(exercise.exercise.muscleGroup)} 
              size={12} 
              color="#fff" 
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.exerciseInfo}>
          {isFocus && <Text style={styles.focusLabel}>FOCUS EXERCISE</Text>}
          <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
          <Text style={styles.exerciseStats}>
            {exercise.targetSets || 3} sets • {exercise.targetRepRange || '8-12'} reps • {exercise.suggestedWeight || 0} {exercise.weightUnit || 'lb'}
          </Text>
        </View>

        {/* Menu Action */}
        <TouchableOpacity onPress={onMenuPress} style={styles.moreIcon}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getMuscleIcon(muscle: string | null): any {
  const m = muscle?.toLowerCase() || '';
  if (m.includes('chest')) return 'human-handsdown';
  if (m.includes('back')) return 'human-handsup';
  if (m.includes('leg') || m.includes('quad') || m.includes('hamstring')) return 'human-male';
  if (m.includes('shoulder')) return 'human-handsup';
  if (m.includes('arm') || m.includes('bicep') || m.includes('tricep')) return 'arm-flex';
  if (m.includes('abs') || m.includes('core')) return 'human-male-board';
  return 'barbell';
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const { user: authUser } = useAuth();
  const { data: todayWorkout, loading: loadingWorkout, error: workoutError, refresh: refreshWorkout } = useTodayWorkout();
  const { profile } = useProfile();
  
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [workoutMenuVisible, setWorkoutMenuVisible] = useState(false);

  const dashState = useMemo<DashState>(() => {
    if (loadingWorkout) return 'loading';
    if (workoutError) return 'error';
    if (!todayWorkout || !todayWorkout.program) return 'no-program';
    if (!todayWorkout.workoutDay || todayWorkout.workoutDay.phase === 'Rest') return 'rest';
    return 'ready';
  }, [loadingWorkout, workoutError, todayWorkout]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refreshWorkout()]);
    setRefreshing(false);
  }, [refreshWorkout]);

  const workoutDay = todayWorkout?.workoutDay;
  const exercises = workoutDay?.exercisePrescriptions ?? [];
  const muscleGroups = useMemo(() => {
    const groups = new Set(exercises.map(ex => ex.exercise.muscleGroup).filter(Boolean));
    return groups.size;
  }, [exercises]);

  const Background = () => <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />;

  const renderHeader = (isEmpty = false) => (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.workoutTitle}>
          {isEmpty ? (dashState === 'rest' ? 'Recovery Day' : 'Apex Protocol') : workoutDay?.workoutType}
        </Text>
        {!isEmpty && (
          <Text style={styles.workoutSubtitle}>
            {exercises.length} Exercises • {muscleGroups} Muscles
          </Text>
        )}
      </View>
      {!isEmpty && (
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.swapBtn}>
            <Ionicons name="swap-horizontal" size={16} color="#fff" />
            <Text style={styles.swapBtnText}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setWorkoutMenuVisible(true)} style={styles.moreHeaderIcon}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ═══ Loading ═══════════════════════════════════════════════════════════════
  if (dashState === 'loading') {
    return (
      <View style={styles.container}><Background />
        <SafeAreaView style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </SafeAreaView>
      </View>
    );
  }

  // ═══ Error ══════════════════════════════════════════════════════════════════
  if (dashState === 'error') {
    return (
      <View style={styles.container}><Background />
        <SafeAreaView style={styles.centeredState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Connection Issue</Text>
          <Text style={styles.emptySub}>{workoutError ?? 'Could not reach the server'}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={refreshWorkout}>
            <Text style={styles.primaryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Background />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {/* Top Mini Header (My Plan) */}
        <View style={styles.miniHeader}>
          <TouchableOpacity style={styles.planSelector} onPress={() => navigation.navigate('PlanDetails')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authUser?.name?.substring(0, 1).toUpperCase() || 'A'}</Text>
            </View>
            <Text style={styles.planText}>My Plan</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.brandPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
        >
          {dashState === 'ready' && workoutDay ? (
            <>
              {/* Main Header */}
              {renderHeader()}

              {/* Filters */}
              <View style={styles.filtersRow}>
                <Pillar label="1h 15m" />
                <Pillar label="Equipment" />
              </View>

              {/* Exercise List */}
              <View style={styles.listContainer}>
                {exercises.map((ex, idx) => (
                  <ExerciseCard 
                    key={ex.id} 
                    exercise={ex} 
                    index={idx} 
                    isLast={idx === exercises.length - 1}
                    isFocus={idx === 0}
                    onMenuPress={() => {
                      setSelectedExercise(ex);
                      setMenuVisible(true);
                    }}
                  />
                ))}

                {/* Add Exercise Card */}
                <TouchableOpacity style={styles.addExerciseCard}>
                  <View style={styles.addIconContainer}>
                    <Ionicons name="add" size={24} color={colors.brandPrimary} />
                  </View>
                  <Text style={styles.addExerciseText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
               {renderHeader(true)}
               
               {dashState === 'no-program' ? (
                 <View style={styles.emptyStateCard}>
                   <View style={styles.emptyIconCircle}>
                     <Ionicons name="sparkles" size={32} color={colors.brandPrimary} />
                   </View>
                   <Text style={styles.emptyStateTitle}>Welcome to Apex</Text>
                   <Text style={styles.emptyStateSub}>
                     You haven't assigned a program yet. Generate your protocol to start training.
                   </Text>
                   <TouchableOpacity 
                     style={styles.primaryBtn} 
                     onPress={() => navigation.navigate('Onboarding' as never)}
                   >
                     <Text style={styles.primaryBtnText}>GET STARTED</Text>
                   </TouchableOpacity>
                 </View>
               ) : (
                 <View style={styles.emptyStateCard}>
                   <View style={styles.emptyIconCircle}>
                     <Ionicons name="moon" size={32} color={colors.accentSecondary} />
                   </View>
                   <Text style={styles.emptyStateTitle}>Rest & Recover</Text>
                   <Text style={styles.emptyStateSub}>
                     Rest is where the growth happens. Use today to focus on nutrition and mobility.
                   </Text>
                   <TouchableOpacity 
                     style={[styles.primaryBtn, { backgroundColor: colors.surfaceElevated }]}
                     onPress={() => navigation.navigate('Log' as never)}
                   >
                     <Text style={styles.primaryBtnText}>VIEW HISTORY</Text>
                   </TouchableOpacity>
                 </View>
               )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky Start Button */}
        {dashState === 'ready' && (
          <View style={styles.stickyFooter}>
            <TouchableOpacity 
              style={styles.startBtn} 
              onPress={() => navigation.navigate('Workout' as never)}
              activeOpacity={0.9}
            >
              <Text style={styles.startBtnText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Workout Menu Modal */}
      <Modal visible={workoutMenuVisible} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setWorkoutMenuVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Workout Options</Text>
            
            <TouchableOpacity style={styles.sheetAction}>
              <Ionicons name="bookmark-outline" size={24} color="#fff" />
              <Text style={styles.sheetActionText}>Save workout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetAction}>
              <Ionicons name="repeat-outline" size={24} color="#fff" />
              <Text style={styles.sheetActionText}>Build superset/circuit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetAction}>
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.sheetActionText}>Share workout link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetAction} onPress={() => { setWorkoutMenuVisible(false); refreshWorkout(); }}>
              <Ionicons name="refresh-outline" size={24} color="#fff" />
              <Text style={styles.sheetActionText}>Refresh workout</Text>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Exercise Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedExercise?.exercise?.name}</Text>
            
            <TouchableOpacity style={styles.sheetAction}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
              <Text style={styles.sheetActionText}>View Exercise Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetAction}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#fff" />
              <Text style={styles.sheetActionText}>Replace Exercise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetAction}>
              <Ionicons name="trash-outline" size={24} color={colors.danger} />
              <Text style={[styles.sheetActionText, { color: colors.danger }]}>Remove from Workout</Text>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, minHeight: 300 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  miniHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  planSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700', // Yellow as in screenshot
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  planText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  workoutTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  workoutSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  swapBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  moreHeaderIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillarLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 20,
  },
  exerciseCardContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: 40,
    top: 60,
    bottom: -40,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: -1,
  },
  exerciseCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  muscleBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  focusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  exerciseStats: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  moreIcon: {
    padding: 8,
  },
  addExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  addExerciseText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  startBtn: {
    backgroundColor: colors.brandPrimary,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  // Modal / Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Empty states
  emptyContainer: { flex: 1 },
  emptyStateCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSub: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
});
