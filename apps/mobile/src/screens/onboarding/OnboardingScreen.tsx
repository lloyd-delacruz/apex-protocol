import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { 
  useOnboarding, 
  CoreGoal, 
  Consistency, 
  ExperienceLevel, 
  Environment, 
  BestLift, 
  BodyStats 
} from '../../context/OnboardingContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// ─── Components ───────────────────────────────────────────────────────────────

interface StepProps {
  onNext: () => void;
  onPrev?: () => void;
}

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
  </View>
);

const OptionCard = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.optionCard, selected && styles.optionCardSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

// ─── Steps ───────────────────────────────────────────────────────────────────

const Step1Welcome = ({ onNext }: StepProps) => (
  <View style={styles.stepContainer}>
    <View style={styles.heroBadge}>
      <Text style={styles.heroBadgeText}>AP</Text>
    </View>
    <Text style={styles.title}>Welcome to{'\n'}<Text style={styles.italic}>Apex Protocol</Text></Text>
    <Text style={styles.subtitle}>
      The most advanced algorithmic training system for serious athletes.
    </Text>
    <View style={{ flex: 1 }} />
    <TouchableOpacity style={styles.brandButton} onPress={onNext}>
      <Text style={styles.brandButtonText}>GET STARTED</Text>
    </TouchableOpacity>
  </View>
);

const Step2Goal = ({ onNext }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const options: { label: string; value: CoreGoal }[] = [
    { label: 'Maximum Strength', value: 'strength' },
    { label: 'Muscle Building', value: 'muscle' },
    { label: 'Body Composition', value: 'body_composition' },
    { label: 'Weight Loss', value: 'weight_loss' },
    { label: 'General Fitness', value: 'general_fitness' },
    { label: 'Athletic Performance', value: 'performance' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What is your{'\n'}<Text style={styles.italic}>primary goal?</Text></Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.goal === opt.value}
            onPress={() => updateState({ goal: opt.value })}
          />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.brandButton, !state.goal && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!state.goal}
      >
        <Text style={styles.brandButtonText}>CONTINUE</Text>
      </TouchableOpacity>
    </View>
  );
};

const Step3Consistency = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const options: { label: string; value: Consistency }[] = [
    { label: 'Brand New', value: 'brand_new' },
    { label: 'Returning from Break', value: 'returning' },
    { label: 'Inconsistent', value: 'inconsistent' },
    { label: 'Consistent (1-3 days)', value: 'consistent' },
    { label: 'Highly Consistent (4+ days)', value: 'very_consistent' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How consistent are you?</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.consistency === opt.value}
            onPress={() => updateState({ consistency: opt.value })}
          />
        ))}
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.brandButton, { flex: 2 }, !state.consistency && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!state.consistency}
        >
          <Text style={styles.brandButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Step4Experience = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const options: { label: string; value: ExperienceLevel }[] = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What is your experience level?</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.experience === opt.value}
            onPress={() => updateState({ experience: opt.value })}
          />
        ))}
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.brandButton, { flex: 2 }, !state.experience && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!state.experience}
        >
          <Text style={styles.brandButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Step5Environment = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const options: { label: string; value: Environment }[] = [
    { label: 'Commercial Gym', value: 'commercial_gym' },
    { label: 'Small / Hotel Gym', value: 'small_gym' },
    { label: 'Home Gym (Full)', value: 'home_gym' },
    { label: 'Minimal Home', value: 'minimal_home' },
    { label: 'Bodyweight Only', value: 'bodyweight_only' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where do you train?</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.environment === opt.value}
            onPress={() => updateState({ environment: opt.value })}
          />
        ))}
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.brandButton, { flex: 2 }, !state.environment && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!state.environment}
        >
          <Text style={styles.brandButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Step6Equipment = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const options = [
    'Barbell', 'Dumbbells', 'Kettlebells', 'Pull-up Bar', 'Bench', 'Squat Rack', 'Cables', 'Leg Press'
  ];

  const toggle = (item: string) => {
    const next = state.equipment.includes(item)
      ? state.equipment.filter(i => i !== item)
      : [...state.equipment, item];
    updateState({ equipment: next });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select your{'\n'}<Text style={styles.italic}>equipment</Text></Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionCard, state.equipment.includes(opt) && styles.optionCardSelected]}
            onPress={() => toggle(opt)}
          >
            <Text style={[styles.optionLabel, state.equipment.includes(opt) && styles.optionLabelSelected]}>{opt}</Text>
            <View style={[styles.checkbox, state.equipment.includes(opt) && styles.checkboxSelected]}>
               {state.equipment.includes(opt) && <Text style={{color: '#fff', fontSize: 10}}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.brandButton, { flex: 2 }, state.equipment.length === 0 && styles.buttonDisabled]}
          onPress={onNext}
          disabled={state.equipment.length === 0}
        >
          <Text style={styles.brandButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Step7CalibrationIntro = ({ onNext, onPrev }: StepProps) => (
  <View style={styles.stepContainer}>
    <View style={styles.heroBadge}>
      <Text style={styles.heroBadgeText}>⚡</Text>
    </View>
    <Text style={styles.title}>Calibration Phase</Text>
    <Text style={styles.subtitle}>
      Our algorithm needs your baseline strength to build your initial loads. Skip this if you'd rather calibrate during your first workout.
    </Text>
    <View style={{ flex: 1 }} />
    <TouchableOpacity style={styles.brandButton} onPress={onNext}>
      <Text style={styles.brandButtonText}>TAILOR MY PLAN</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={onNext}>
      <Text style={styles.secondaryButtonText}>Skip for now</Text>
    </TouchableOpacity>
  </View>
);

const Step8BestLifts = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const lifts = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];

  const updateLift = (name: string, weight: string) => {
    const numeric = parseInt(weight, 10) || 0;
    const next = [...state.bestLifts.filter(l => l.exercise !== name), { exercise: name, reps: 5, weight: numeric, unit: state.bodyStats.unit as 'kg' | 'lbs' }];
    updateState({ bestLifts: next });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter your{'\n'}<Text style={styles.italic}>best lifts</Text></Text>
      <Text style={styles.subtitle}>Approximate 5-rep max weight</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {lifts.map(lift => (
          <View key={lift} style={styles.inputCard}>
            <Text style={styles.inputLabel}>{lift}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                onChangeText={(v) => updateLift(lift, v)}
              />
              <Text style={styles.unitText}>{state.bodyStats.unit}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.brandButton, { flex: 2 }]} onPress={onNext}>
          <Text style={styles.brandButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Step9WeeklyGoal = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const options = [2, 3, 4, 5, 6];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How many{'\n'}<Text style={styles.italic}>days per week?</Text></Text>
      <View style={styles.daysGrid}>
        {options.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayCard, state.workoutsPerWeek === day && styles.dayCardActive]}
            onPress={() => updateState({ workoutsPerWeek: day })}
          >
            <Text style={[styles.dayNumber, state.workoutsPerWeek === day && styles.dayNumberActive]}>{day}</Text>
            <Text style={[styles.dayLabel, state.workoutsPerWeek === day && styles.dayLabelActive]}>Days</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.brandButton, { flex: 2 }]} onPress={onNext}>
          <Text style={styles.brandButtonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Step10Notifications = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  return (
    <View style={styles.stepContainer}>
      <View style={styles.heroBadge}>
         <Text style={styles.heroBadgeText}>🔔</Text>
      </View>
      <Text style={styles.title}>Stay Accountable</Text>
      <Text style={styles.subtitle}>
        92% of users who enable notifications stay consistent with their Protocol.
      </Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity 
        style={styles.brandButton} 
        onPress={() => { updateState({ notificationsEnabled: true }); onNext(); }}
      >
        <Text style={styles.brandButtonText}>ENABLE NOTIFICATIONS</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={onNext}>
        <Text style={styles.secondaryButtonText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
};

const Step11BodyStats = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  return (
    <View style={styles.stepContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev}>
          <Text style={{ color: colors.brandPrimary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Body Stats</Text>
        <TouchableOpacity onPress={onNext}>
          <Text style={{ color: colors.brandPrimary, fontSize: 16 }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.syncCard}>
          <Text style={[styles.title, { fontSize: 28 }]}>Sync with{'\n'}<Text style={styles.italic}>Apple Health</Text></Text>
          <View style={styles.bulletRow}>
             <Text style={styles.bulletIcon}>👤</Text>
             <Text style={styles.bulletText}>Exercises, reps and weight that match your profile</Text>
          </View>
          <View style={styles.bulletRow}>
             <Text style={styles.bulletIcon}>🔥</Text>
             <Text style={styles.bulletText}>Calculate calories burned</Text>
          </View>
          <View style={styles.bulletRow}>
             <Text style={styles.bulletIcon}>📈</Text>
             <Text style={styles.bulletText}>Track your fitness progress</Text>
          </View>
          <View style={styles.bulletRow}>
             <Text style={styles.bulletIcon}>🔒</Text>
             <View style={{ flex: 1 }}>
               <Text style={[styles.bulletText, { fontWeight: '700', marginBottom: 2 }]}>Secure and private</Text>
               <Text style={[styles.bulletText, { fontSize: 12, color: colors.textMuted }]}>
                 We don't sell your data to third parties. It stays on our server to help customize your workouts.
               </Text>
             </View>
          </View>
          
          <TouchableOpacity style={styles.whiteButton} onPress={() => {}}>
             <Text style={styles.whiteButtonText}>Sync with Apple Health</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignSelf: 'center', marginTop: 12 }}>
             <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>Learn More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={[styles.title, { fontSize: 24, marginBottom: 4 }]}>Enter manually</Text>
        <Text style={[styles.subtitle, { marginBottom: 12 }]}>Optional and can be added later</Text>
        
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Select Gender"
              placeholderTextColor={colors.textMuted}
              value={state.bodyStats.gender}
              onChangeText={(v) => updateState({ bodyStats: { ...state.bodyStats, gender: v } })}
            />
            <Text style={{ color: colors.textMuted }}>▼</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="MM / DD / YYYY"
              placeholderTextColor={colors.textMuted}
              value={state.bodyStats.dob}
              onChangeText={(v) => updateState({ bodyStats: { ...state.bodyStats, dob: v } })}
            />
            <Text style={{ color: colors.textMuted }}>▼</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.brandButton} onPress={onNext}>
        <Text style={styles.brandButtonText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
};

const Step12Experience = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const options = ['Instagram', 'TikTok', 'Facebook', 'ChatGPT', 'YouTube', 'Other'];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev}>
          <Text style={{ color: colors.brandPrimary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Experience</Text>
        <TouchableOpacity onPress={onNext}>
          <Text style={{ color: colors.brandPrimary, fontSize: 16 }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { fontSize: 28, marginTop: 20 }]}>How did you hear{'\n'}about <Text style={styles.italic}>Apex Protocol?</Text></Text>
      
      <ScrollView style={{ marginTop: 24 }} showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.referralOption}
            onPress={() => updateState({ referralSource: opt })}
          >
            <Text style={[styles.optionLabel, state.referralSource === opt && { color: colors.brandPrimary }]}>{opt}</Text>
            <View style={[styles.radio, state.referralSource === opt && styles.radioSelected]}>
              {state.referralSource === opt && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.brandButton, !state.referralSource && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!state.referralSource}
      >
        <Text style={styles.brandButtonText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
};

const Step13Finalization = ({ onNext }: StepProps) => {
  const { generateProgram } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function run() {
      try {
        setError(null);
        setLoading(true);
        await generateProgram();
        onNext();
      } catch (err: any) {
        setError(err.message || 'Generation failed');
        setLoading(false);
      }
    }
    run();
  }, [retryCount]);

  if (error) {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>{error}</Text>
        <TouchableOpacity style={styles.brandButton} onPress={() => setRetryCount(prev => prev + 1)}>
          <Text style={styles.brandButtonText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.stepContainer, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.title, { marginTop: 24, textAlign: 'center' }]}>Defining your Protocol</Text>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>Our progression engine is tailoring the perfect program for your goals and equipment.</Text>
    </View>
  );
};

const Step14ProgramSummary = ({ onNext, onPrev }: StepProps) => {
  const { state } = useOnboarding();
  
  const programDetails = [
    { label: 'Training Style', value: state.goal?.replace('_', ' ') || 'Strength Training', icon: '🏋️' },
    { label: 'Muscle Split', value: 'Upper/Lower', icon: '📅' },
    { label: 'Equipment Profile', value: state.environment?.replace('_', ' ') || 'Large Gym', icon: '💪' },
    { label: 'Exercise Difficulty', value: state.experience || 'Advanced', icon: '⚙️' },
  ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev}>
          <Text style={{ color: colors.brandPrimary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Program</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={[styles.title, { fontSize: 32, textAlign: 'center', marginTop: 20, color: '#FDFD96' }]}>
        Lift heavier
      </Text>
      <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 4, marginBottom: 40 }]}>
        Review your program details. You can always edit these later in the app.
      </Text>

      <View style={{ gap: 12 }}>
        {programDetails.map((item, idx) => (
          <View key={idx} style={styles.summaryItemCard}>
            <View style={styles.summaryItemIconContainer}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            </View>
            <View>
              <Text style={styles.summaryItemLabel}>{item.label}</Text>
              <Text style={styles.summaryItemValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.brandButton} onPress={onNext}>
        <Text style={styles.brandButtonText}>GET YOUR PROGRAM</Text>
      </TouchableOpacity>
    </View>
  );
};

const Step15Paywall = () => {
  const { completeOnboarding } = useOnboarding();
  const [billing, setBilling] = useState<'yearly' | 'monthly'>('yearly');
  const [completing, setCompleting] = useState(false);

  return (
    <View style={styles.stepContainer}>
      <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 30 }}>
         <Text style={{ color: colors.textMuted, fontSize: 28, fontWeight: '900', letterSpacing: 2, marginBottom: 20 }}>APEX</Text>
         <Text style={[styles.title, { textAlign: 'center', fontSize: 28 }]}>Try 7 days for free</Text>
         <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 20 }]}>then $129.99/year ($10.83/month)</Text>
      </View>

      <View style={styles.toggleContainer}>
         <TouchableOpacity 
           style={[styles.toggleButton, billing === 'yearly' && styles.toggleButtonActive]}
           onPress={() => setBilling('yearly')}
         >
           <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.toggleButton, billing === 'monthly' && styles.toggleButtonActive]}
           onPress={() => setBilling('monthly')}
         >
           <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.benefitsContainer}>
         {[
           { t: 'Built for your body', d: 'Workouts that match your history & needs' },
           { t: 'Tailored to your goal', d: 'Watch strength & body metrics improve' },
           { t: 'Customized to your equipment', d: 'Use only what you have available' },
           { t: 'Works with your schedule', d: 'A plan that updates when you miss a day' },
         ].map((b, i) => (
           <View key={i} style={styles.benefitRow}>
             <Text style={{ color: colors.brandPrimary, marginRight: 12, fontSize: 18 }}>✓</Text>
             <View>
               <Text style={styles.benefitTitle}>{b.t}</Text>
               <Text style={styles.benefitDesc}>{b.d}</Text>
             </View>
           </View>
         ))}
      </View>

      <View style={{ flex: 1 }} />
      <Text style={{ textAlign: 'center', color: colors.textMuted, marginBottom: 12 }}>No payment due today</Text>
      <TouchableOpacity
        style={[styles.brandButton, completing && { opacity: 0.6 }]}
        disabled={completing}
        onPress={async () => {
          setCompleting(true);
          try {
            console.log('[Onboarding] Completing onboarding — syncing profile to backend');
            await completeOnboarding();
            console.log('[Onboarding] Complete — navigating to main app');
          } catch (err: any) {
            console.error('[Onboarding] completeOnboarding failed:', err);
            Alert.alert('Error', err.message ?? 'Failed to complete setup. Please try again.');
            setCompleting(false);
          }
        }}
      >
        {completing ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={styles.brandButtonText}>START YOUR FREE TRIAL</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footerLinks}>
         <Text style={styles.footerLink}>Have a subscription?</Text>
         <View style={{ flexDirection: 'row', gap: 16 }}>
           <Text style={styles.footerLink}>Privacy</Text>
           <Text style={styles.footerLink}>Terms</Text>
         </View>
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const { state, nextStep, prevStep } = useOnboarding();
  const progress = state.step / 15;

  const renderStep = () => {
    switch (state.step) {
      case 1:  return <Step1Welcome onNext={nextStep} />;
      case 2:  return <Step2Goal onNext={nextStep} />;
      case 3:  return <Step3Consistency onNext={nextStep} onPrev={prevStep} />;
      case 4:  return <Step4Experience onNext={nextStep} onPrev={prevStep} />;
      case 5:  return <Step9WeeklyGoal onNext={nextStep} onPrev={prevStep} />;
      case 6:  return <Step5Environment onNext={nextStep} onPrev={prevStep} />;
      case 7:  return <Step6Equipment onNext={nextStep} onPrev={prevStep} />;
      case 8:  return <Step7CalibrationIntro onNext={nextStep} onPrev={prevStep} />;
      case 9:  return <Step8BestLifts onNext={nextStep} onPrev={prevStep} />;
      case 10: return <Step11BodyStats onNext={nextStep} onPrev={prevStep} />;
      case 11: return <Step10Notifications onNext={nextStep} onPrev={prevStep} />;
      case 12: return <Step12Experience onNext={nextStep} onPrev={prevStep} />;
      case 13: return <Step13Finalization onNext={nextStep} />;
      case 14: return <Step14ProgramSummary onNext={nextStep} onPrev={prevStep} />;
      case 15: return <Step15Paywall />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#1A1A26']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ProgressBar progress={progress} />
        {renderStep()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' },
  progressBar: { height: '100%', backgroundColor: colors.brandPrimary },
  stepContainer: { flex: 1, padding: 24 },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  heroBadgeText: { color: colors.textPrimary, fontSize: 32, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  italic: { fontStyle: 'italic', fontWeight: '900' },
  subtitle: { fontSize: 16, color: colors.textMuted, lineHeight: 24, marginBottom: 40 },
  stepTitle: { fontSize: 32, fontWeight: '800', fontStyle: 'italic', color: colors.textPrimary, marginBottom: 24, lineHeight: 40 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionCardSelected: {},
  optionLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  optionLabelSelected: { color: colors.brandPrimary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary },
  brandButton: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  brandButtonText: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  buttonDisabled: { opacity: 0.3 },
  // Paywall Specific
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 21 },
  toggleButtonActive: { backgroundColor: colors.textPrimary },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: colors.background },
  benefitsContainer: { gap: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  benefitTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  benefitDesc: { fontSize: 14, color: colors.textMuted },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20 },
  footerLink: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
  // Body Stats Specific
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  syncCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bulletIcon: { fontSize: 18, marginRight: 12 },
  bulletText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  whiteButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  whiteButtonText: { color: colors.brandPrimary, fontSize: 16, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputLabel: { fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textInput: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', padding: 0 },
  unitText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  // Days Grid
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  dayCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dayCardActive: { borderColor: colors.brandPrimary, backgroundColor: 'rgba(255, 45, 85, 0.05)' },
  dayNumber: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  dayNumberActive: { color: colors.brandPrimary },
  dayLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  dayLabelActive: { color: colors.brandPrimary },
  // Summary
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: colors.textMuted },
  summaryValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textTransform: 'capitalize' },
  // New Styles
  referralOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  summaryItemCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryItemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItemLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  summaryItemValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  socialButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  loginCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  loginCardText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', fontStyle: 'italic' },
  termsText: { textAlign: 'center', color: colors.textMuted, fontSize: 12, lineHeight: 18, paddingHorizontal: 20 },
  linkText: { color: colors.textPrimary, textDecorationLine: 'underline' },
});
