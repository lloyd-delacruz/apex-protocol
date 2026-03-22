import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
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
  onNext: (step?: number) => void;
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
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) => (
  <TouchableOpacity
    style={[styles.optionCard, selected && styles.optionCardSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {icon ? (
        <View style={[styles.optionIconContainer, selected && styles.optionIconContainerSelected]}>
          {icon as any}
        </View>
      ) : null}
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    </View>
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

// ─── Steps ───────────────────────────────────────────────────────────────────

const StepWelcome = ({ onNext }: StepProps) => (
  <View style={styles.stepContainer}>
    <View style={styles.premiumIconContainer}>
      <Image 
        source={require('../../../assets/onboarding/welcome.png')} 
        style={styles.onboardingIcon} 
      />
    </View>
    <Text style={styles.title}>Welcome to{'\n'}<Text style={styles.brandAccent}>Apex Protocol</Text></Text>
    <Text style={styles.subtitle}>
      The most advanced algorithmic training system for serious athletes.
    </Text>
    <View style={{ flex: 1 }} />
    <TouchableOpacity activeOpacity={0.8} onPress={() => onNext()}>
      <LinearGradient
        colors={[colors.brandPrimary, colors.brandSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.brandButtonGradient}
      >
        <Text style={styles.brandButtonText}>GET STARTED</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const StepFitnessGoal = ({ onNext }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const options: { label: string; value: CoreGoal; icon: string; provider: 'Ionicons' | 'MaterialCommunityIcons' }[] = [
    { label: 'Maximum Strength', value: 'strength', icon: 'barbell-outline', provider: 'Ionicons' },
    { label: 'Muscle Building', value: 'muscle', icon: 'arm-flex-outline', provider: 'MaterialCommunityIcons' },
    { label: 'Body Composition', value: 'body_composition', icon: 'body-outline', provider: 'Ionicons' },
    { label: 'Weight Loss', value: 'weight_loss', icon: 'scale-outline', provider: 'Ionicons' },
    { label: 'General Fitness', value: 'general_fitness', icon: 'heart-outline', provider: 'Ionicons' },
    { label: 'Athletic Performance', value: 'performance', icon: 'speedometer-outline', provider: 'Ionicons' },
  ];

  const handleContinue = () => {
    if (!state.goal) {
      setError('Please select your primary fitness goal.');
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What is your{'\n'}<Text style={styles.brandAccent}>primary goal?</Text></Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.goal === opt.value}
            onPress={() => {
              updateState({ goal: opt.value });
              if (error) setError(null);
            }}
            icon={
              opt.provider === 'Ionicons' ? (
                <Ionicons name={opt.icon as any} size={22} color={state.goal === opt.value ? colors.brandPrimary : colors.textMuted} />
              ) : (
                <MaterialCommunityIcons name={opt.icon as any} size={22} color={state.goal === opt.value ? colors.brandPrimary : colors.textMuted} />
              )
            }
          />
        ))}
      </ScrollView>
      {error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleContinue}
        style={{ marginTop: 20 }}
      >
        <LinearGradient
          colors={[colors.brandPrimary, colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.brandButtonGradient, !state.goal && { opacity: 0.5 }]}
        >
          <Text style={styles.brandButtonText}>CONTINUE</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const StepConsistency = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const options: { label: string; value: Consistency; icon: string }[] = [
    { label: 'Brand New', value: 'brand_new', icon: 'leaf-outline' },
    { label: 'Returning from Break', value: 'returning', icon: 'refresh-outline' },
    { label: 'Inconsistent', value: 'inconsistent', icon: 'trending-down-outline' },
    { label: 'Consistent (1-3 days)', value: 'consistent', icon: 'trending-up-outline' },
    { label: 'Highly Consistent (4+ days)', value: 'very_consistent', icon: 'flame-outline' },
  ];

  const handleContinue = () => {
    if (!state.consistency) {
      setError('Please select your consistency level.');
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How consistent are you?</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.consistency === opt.value}
            onPress={() => {
              updateState({ consistency: opt.value });
              if (error) setError(null);
            }}
            icon={<Ionicons name={opt.icon as any} size={22} color={state.consistency === opt.value ? colors.brandPrimary : colors.textMuted} />}
          />
        ))}
      </ScrollView>
      {error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flex: 2 }}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandButtonGradient, !state.consistency && { opacity: 0.5 }]}
          >
            <Text style={styles.brandButtonText}>CONTINUE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepExperienceLevel = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const options: { label: string; value: ExperienceLevel; icon: string }[] = [
    { label: 'Beginner', value: 'beginner', icon: 'school-outline' },
    { label: 'Intermediate', value: 'intermediate', icon: 'ribbon-outline' },
    { label: 'Advanced', value: 'advanced', icon: 'trophy-outline' },
  ];

  const handleContinue = () => {
    if (!state.experience) {
      setError('Please select your experience level.');
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What is your experience level?</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.experience === opt.value}
            onPress={() => {
              updateState({ experience: opt.value });
              if (error) setError(null);
            }}
            icon={<Ionicons name={opt.icon as any} size={22} color={state.experience === opt.value ? colors.brandPrimary : colors.textMuted} />}
          />
        ))}
      </ScrollView>
      {error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flex: 2 }}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandButtonGradient, !state.experience && { opacity: 0.5 }]}
          >
            <Text style={styles.brandButtonText}>CONTINUE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepEnvironment = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const options: { label: string; value: Environment; icon: string }[] = [
    { label: 'Commercial Gym', value: 'commercial_gym', icon: 'business-outline' },
    { label: 'Small / Hotel Gym', value: 'small_gym', icon: 'bed-outline' },
    { label: 'Home Gym (Full)', value: 'home_gym', icon: 'home-outline' },
    { label: 'Minimal Home', value: 'minimal_home', icon: 'cube-outline' },
    { label: 'Bodyweight Only', value: 'bodyweight_only', icon: 'body-outline' },
  ];

  const handleContinue = () => {
    if (!state.environment) {
      setError('Please select where you will be training.');
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where do you train?</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={state.environment === opt.value}
            onPress={() => {
              updateState({ environment: opt.value });
              if (error) setError(null);
            }}
            icon={<Ionicons name={opt.icon as any} size={22} color={state.environment === opt.value ? colors.brandPrimary : colors.textMuted} />}
          />
        ))}
      </ScrollView>
      {error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flex: 2 }}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandButtonGradient, !state.environment && { opacity: 0.5 }]}
          >
            <Text style={styles.brandButtonText}>CONTINUE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepEquipment = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const options = [
    'Barbell', 'Dumbbells', 'Kettlebells', 'Pull-up Bar', 'Bench', 'Squat Rack', 'Cables', 'Leg Press'
  ];

  const toggle = (item: string) => {
    const next = state.equipment.includes(item)
      ? state.equipment.filter(i => i !== item)
      : [...state.equipment, item];
    updateState({ equipment: next });
    if (error && next.length > 0) setError(null);
  };

  const handleContinue = () => {
    if (state.equipment.length === 0) {
      setError('Please select at least one piece of equipment.');
      return;
    }
    onNext();
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
               {state.equipment.includes(opt) && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flex: 2 }}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandButtonGradient, state.equipment.length === 0 && { opacity: 0.5 }]}
          >
            <Text style={styles.brandButtonText}>CONTINUE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepCalibrationIntro = ({ onNext, onPrev }: StepProps) => (
  <View style={styles.stepContainer}>
    <View style={styles.premiumIconContainer}>
      <Image 
        source={require('../../../assets/onboarding/calibration.png')} 
        style={styles.onboardingIcon} 
      />
    </View>
    <Text style={styles.title}>Calibration Phase</Text>
    <Text style={styles.subtitle}>
      Our algorithm needs your baseline strength to build your initial loads. Skip this if you'd rather calibrate during your first workout.
    </Text>
    <View style={{ flex: 1 }} />
    <TouchableOpacity style={styles.brandButton} onPress={() => onNext()}>
      <Text style={styles.brandButtonText}>TAILOR MY PLAN</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => onNext(9)}>
      <Text style={styles.secondaryButtonText}>Skip for now</Text>
    </TouchableOpacity>
  </View>
);

const StepBestLifts = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const lifts = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    lifts.forEach(lift => {
      const existing = state.bestLifts.find(l => l.exercise === lift);
      initial[lift] = existing && existing.weight > 0 ? existing.weight.toString() : '';
    });
    return initial;
  });

  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const currentUnit = state.bodyStats.unit;
  const isFormValid = lifts.every(lift => values[lift] && parseInt(values[lift], 10) > 0);

  const handleContinue = () => {
    if (!isFormValid) {
      setError('Please enter a weight for all exercises.');
      return;
    }

    const nextLifts = lifts.map(lift => ({
      exercise: lift,
      reps: 5,
      weight: parseInt(values[lift], 10) || 0,
      unit: currentUnit as 'kg' | 'lbs'
    }));
    updateState({ bestLifts: nextLifts });
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev}>
          <Ionicons name="chevron-back" size={24} color={colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>One-Rep Max</Text>
        <TouchableOpacity onPress={() => onNext()}>
          <Text style={{ color: colors.brandPrimary, fontSize: 16, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { fontSize: 24, marginTop: 20 }]}>Estimate your{'\n'}<Text style={styles.brandAccent}>current 1RM</Text></Text>
      <Text style={[styles.subtitle, { marginBottom: 20 }]}>This helps our algorithm determine your starting intensity.</Text>

      <View style={[styles.toggleContainer, { marginBottom: 20 }]}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.toggleButton, currentUnit === 'lbs' && styles.toggleButtonActive]}
            onPress={() => updateState({ bodyStats: { ...state.bodyStats, unit: 'lbs' } })}
          >
            <Text style={[styles.toggleText, currentUnit === 'lbs' && styles.toggleTextActive]}>LBS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.toggleButton, currentUnit === 'kg' && styles.toggleButtonActive]}
            onPress={() => updateState({ bodyStats: { ...state.bodyStats, unit: 'kg' } })}
          >
            <Text style={[styles.toggleText, currentUnit === 'kg' && styles.toggleTextActive]}>KG</Text>
          </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {lifts.map((lift, index) => {
          const isFocused = focusedField === lift;
          return (
            <View key={lift} style={[styles.inputCard, isFocused && styles.inputCardFocused]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 4 }}>
                <Text style={[styles.inputLabel, isFocused && { color: colors.brandPrimary }]}>{lift}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    ref={el => { inputRefs.current[lift] = el; }}
                    style={[styles.liftInput, { textAlign: 'right', minWidth: 60 }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={values[lift]}
                    onFocus={() => setFocusedField(lift)}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(val) => {
                      const numericVal = val.replace(/[^0-9]/g, '');
                      setValues(prev => ({ ...prev, [lift]: numericVal }));
                      if (error) setError(null);
                    }}
                  />
                  <Text style={[styles.unitText, { marginLeft: 8, color: isFocused ? colors.textPrimary : colors.textMuted }]}>{currentUnit}</Text>
                </View>
              </View>
            </View>
          );
        })}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          activeOpacity={0.8}
          style={{ flex: 2 }}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandButtonGradient, !isFormValid && styles.buttonDisabled]}
          >
            <Text style={styles.brandButtonText}>CONTINUE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepWeeklyGoal = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const options = [2, 3, 4, 5, 6];

  const handleContinue = () => {
    if (!state.workoutsPerWeek) {
      setError('Please select how many days per week you can train.');
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.premiumIconContainer}>
        <Image 
          source={require('../../../assets/onboarding/calendar.png')} 
          style={styles.onboardingIcon} 
        />
      </View>
      <Text style={styles.stepTitle}>How many{'\n'}<Text style={styles.brandAccent}>days per week?</Text></Text>
      <View style={styles.daysGrid}>
        {options.map(day => (
          <TouchableOpacity
            key={day}
            activeOpacity={0.7}
            style={[styles.dayCard, state.workoutsPerWeek === day && styles.dayCardActive]}
            onPress={() => {
              updateState({ workoutsPerWeek: day });
              if (error) setError(null);
            }}
          >
            <Text style={[styles.dayNumber, state.workoutsPerWeek === day && styles.dayNumberActive]}>{day}</Text>
            <Text style={[styles.dayLabel, state.workoutsPerWeek === day && styles.dayLabelActive]}>Days</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onPrev}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={{ flex: 2 }} onPress={handleContinue}>
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandButtonGradient, !state.workoutsPerWeek && { opacity: 0.5 }]}
          >
            <Text style={styles.brandButtonText}>CONTINUE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepNotifications = ({ onNext, onPrev }: StepProps) => {
  const { updateState } = useOnboarding();
  return (
    <View style={styles.stepContainer}>
      <View style={styles.premiumIconContainer}>
        <Image 
          source={require('../../../assets/onboarding/notifications.png')} 
          style={styles.onboardingIcon} 
        />
      </View>
      <Text style={styles.title}>Stay Accountable</Text>
      <Text style={styles.subtitle}>
        92% of users who enable notifications stay consistent with their Protocol.
      </Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => { updateState({ notificationsEnabled: true }); onNext(); }}
      >
        <LinearGradient
          colors={[colors.brandPrimary, colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.brandButtonGradient}
        >
          <Text style={styles.brandButtonText}>ENABLE NOTIFICATIONS</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => onNext()}>
        <Text style={styles.secondaryButtonText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
};

const StepBodyStats = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // DOB Parts for better UX
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');

  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const [showGenderModal, setShowGenderModal] = useState(false);

  const genderOptions = [
    'Male', 
    'Female', 
    'Non-binary', 
    'Transgender',
    'Genderqueer / Non-conforming',
    'Genderfluid',
    'Agender',
    'Two-Spirit',
    'Intersex',
    'Questioning',
    'Other',
    'Prefer not to say'
  ];

  const isFormValid = state.bodyStats.gender && 
                      dobMonth.length > 0 && 
                      dobDay.length > 0 && 
                      dobYear.length === 4;

  const handleNext = () => {
    if (!state.bodyStats.gender) {
      setError('Please select your gender.');
      return;
    }
    if (!isFormValid) {
      setError('Please provide a valid date of birth (MM/DD/YYYY).');
      return;
    }
    
    // Auto-pad single digits
    const paddedMonth = dobMonth.length === 1 ? '0' + dobMonth : dobMonth;
    const paddedDay = dobDay.length === 1 ? '0' + dobDay : dobDay;
    
    // Update local state briefly to show the padding (optional but good UI)
    setDobMonth(paddedMonth);
    setDobDay(paddedDay);

    // Validate date logic simple check
    const m = parseInt(paddedMonth, 10);
    const d = parseInt(paddedDay, 10);
    const y = parseInt(dobYear, 10);
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1920 || y > 2024) {
      setError('Please enter a realistic date of birth.');
      return;
    }

    updateState({ bodyStats: { ...state.bodyStats, dob: `${paddedMonth}/${paddedDay}/${dobYear}` } });
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev}>
          <Text style={{ color: colors.brandPrimary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Body Stats</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
          style={styles.syncCard}
        >
          <Text style={[styles.title, { fontSize: 24 }]}>Sync with{'\n'}<Text style={styles.brandAccent}>Apple Health</Text></Text>
          <View style={styles.bulletRow}>
             <Ionicons name="person-circle-outline" size={20} color={colors.brandPrimary} style={{ marginRight: 12 }} />
             <Text style={styles.bulletText}>Exercises, reps and weight that match your profile</Text>
          </View>
          <View style={styles.bulletRow}>
             <Ionicons name="flame-outline" size={20} color={colors.brandPrimary} style={{ marginRight: 12 }} />
             <Text style={styles.bulletText}>Calculate calories burned</Text>
          </View>
          <View style={styles.bulletRow}>
             <Ionicons name="trending-up-outline" size={20} color={colors.brandPrimary} style={{ marginRight: 12 }} />
             <Text style={styles.bulletText}>Track your fitness progress</Text>
          </View>
          
          <TouchableOpacity activeOpacity={0.8} style={styles.whiteButton} onPress={() => {}}>
             <Text style={styles.whiteButtonText}>Sync with Apple Health</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={[styles.title, { fontSize: 22, marginBottom: 16 }]}>Enter manually</Text>
        
        <Text style={[styles.inputLabel, { marginBottom: 12 }]}>Gender</Text>
        <TouchableOpacity 
          style={styles.genderDropdown}
          onPress={() => setShowGenderModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.genderDropdownText,
            !state.bodyStats.gender && { color: colors.textMuted }
          ]}>
            {state.bodyStats.gender || 'Select Gender'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.brandPrimary} />
        </TouchableOpacity>

        <Modal
          visible={showGenderModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGenderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={genderOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      state.bodyStats.gender === item && styles.modalOptionActive
                    ]}
                    onPress={() => {
                      updateState({ bodyStats: { ...state.bodyStats, gender: item } });
                      setShowGenderModal(false);
                      if (error) setError(null);
                      monthRef.current?.focus();
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      state.bodyStats.gender === item && styles.modalOptionTextActive
                    ]}>{item}</Text>
                    {state.bodyStats.gender === item && (
                      <Ionicons name="checkmark" size={20} color={colors.brandPrimary} />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            </View>
          </View>
        </Modal>

        <Text style={[styles.inputLabel, { marginTop: 24, marginBottom: 12 }]}>Date of Birth</Text>
        <View style={styles.dobContainer}>
          <View style={[styles.dobField, focusedField === 'mm' && styles.dobFieldFocused]}>
            <TextInput
              ref={monthRef}
              style={styles.dobInput}
              placeholder="MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              value={dobMonth}
              onFocus={() => setFocusedField('mm')}
              onBlur={() => {
                setFocusedField(null);
                if (dobMonth.length === 1) setDobMonth('0' + dobMonth);
              }}
              onChangeText={(v) => {
                setDobMonth(v);
                if (v.length === 2) dayRef.current?.focus();
                if (error) setError(null);
              }}
            />
          </View>
          <Text style={styles.dobSeparator}>/</Text>
          <View style={[styles.dobField, focusedField === 'dd' && styles.dobFieldFocused]}>
            <TextInput
              ref={dayRef}
              style={styles.dobInput}
              placeholder="DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              value={dobDay}
              onFocus={() => setFocusedField('dd')}
              onBlur={() => {
                setFocusedField(null);
                if (dobDay.length === 1) setDobDay('0' + dobDay);
              }}
              onChangeText={(v) => {
                setDobDay(v);
                if (v.length === 2) yearRef.current?.focus();
                if (v.length === 0) monthRef.current?.focus();
                if (error) setError(null);
              }}
            />
          </View>
          <Text style={styles.dobSeparator}>/</Text>
          <View style={[styles.dobField, { flex: 1.5 }, focusedField === 'yyyy' && styles.dobFieldFocused]}>
            <TextInput
              ref={yearRef}
              style={styles.dobInput}
              placeholder="YYYY"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              value={dobYear}
              onFocus={() => setFocusedField('yyyy')}
              onBlur={() => setFocusedField(null)}
              onChangeText={(v) => {
                setDobYear(v);
                if (v.length === 0) dayRef.current?.focus();
                if (error) setError(null);
              }}
              onSubmitEditing={handleNext}
              returnKeyType="done"
            />
          </View>
        </View>

        {error && (
          <Text style={[styles.errorText, { marginVertical: 20 }]}>{error}</Text>
        )}
      </ScrollView>

      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={handleNext}
        disabled={!isFormValid}
        style={{ marginTop: 20 }}
      >
        <LinearGradient
          colors={[colors.brandPrimary, colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.brandButtonGradient, !isFormValid && styles.buttonDisabled]}
        >
          <Text style={styles.brandButtonText}>NEXT</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const StepReferral = ({ onNext, onPrev }: StepProps) => {
  const { state, updateState } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const options: { label: string; icon: string; provider: 'Ionicons' | 'MaterialCommunityIcons' }[] = [
    { label: 'Instagram', icon: 'logo-instagram', provider: 'Ionicons' },
    { label: 'TikTok', icon: 'logo-tiktok', provider: 'Ionicons' },
    { label: 'Facebook', icon: 'logo-facebook', provider: 'Ionicons' },
    { label: 'ChatGPT', icon: 'chatbox-outline', provider: 'Ionicons' },
    { label: 'YouTube', icon: 'logo-youtube', provider: 'Ionicons' },
    { label: 'Other', icon: 'ellipsis-horizontal-circle-outline', provider: 'Ionicons' },
  ];

  const handleContinue = () => {
    if (!state.referralSource) {
      setError('Please select how you heard about us.');
      return;
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onPrev}>
          <Ionicons name="chevron-back" size={24} color={colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apex Protocol</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.title, { fontSize: 28, marginTop: 20 }]}>How did you hear{'\n'}about <Text style={styles.brandAccent}>Apex Protocol?</Text></Text>
      
      <ScrollView style={{ marginTop: 24 }} showsVerticalScrollIndicator={false}>
        {options.map((opt) => (
          <OptionCard
            key={opt.label}
            label={opt.label}
            selected={state.referralSource === opt.label}
            onPress={() => {
              updateState({ referralSource: opt.label });
              if (error) setError(null);
            }}
            icon={
              opt.provider === 'Ionicons' ? (
                <Ionicons name={opt.icon as any} size={22} color={state.referralSource === opt.label ? colors.brandPrimary : colors.textMuted} />
              ) : (
                <MaterialCommunityIcons name={opt.icon as any} size={22} color={state.referralSource === opt.label ? colors.brandPrimary : colors.textMuted} />
              )
            }
          />
        ))}
      </ScrollView>

      {error && <Text style={[styles.errorText, { marginBottom: 12, textAlign: 'center' }]}>{error}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleContinue}
        style={{ marginTop: 20 }}
      >
        <LinearGradient
          colors={[colors.brandPrimary, colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.brandButtonGradient, !state.referralSource && { opacity: 0.5 }]}
        >
          <Text style={styles.brandButtonText}>NEXT</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const StepFinalization = ({ onNext }: StepProps) => {
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

const StepProgramSummary = ({ onNext, onPrev }: StepProps) => {
  const { state } = useOnboarding();
  
  const programDetails = [
    { label: 'Training Style', value: state.goal?.replace('_', ' ') || 'Strength Training', icon: '🏋️' },
    { label: 'Muscle Split', value: 'Upper/Lower', icon: '📅' },
    { label: 'Equipment Profile', value: state.environment?.replace('_', ' ') || 'Large Gym', icon: '💪' },
    { label: 'Exercise Difficulty', value: state.experience || 'Advanced', icon: '⚙️' },
  ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.premiumIconContainer}>
        <LinearGradient
          colors={[colors.brandPrimary, colors.brandSecondary]}
          style={styles.iconGradient}
        >
          <MaterialCommunityIcons name="brain" size={40} color="#fff" />
        </LinearGradient>
      </View>
      
      <Text style={styles.title}>Your Protocol is{'\n'}<Text style={styles.brandAccent}>Ready.</Text></Text>
      <Text style={styles.subtitle}>Based on your stats, the algorithm has generated a master plan for your physique.</Text>

      <View style={{ flex: 1 }}>
        {programDetails.map((f, i) => (
          <View key={i} style={styles.summaryFeatureRow}>
            <View style={styles.summaryFeatureIcon}>
               <Text style={{ fontSize: 20 }}>{f.icon}</Text>
            </View>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>{f.label}</Text>
              <Text style={styles.summaryFeatureText}>{f.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={() => onNext()}>
        <LinearGradient
          colors={[colors.brandPrimary, colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.brandButtonGradient}
        >
          <Text style={styles.brandButtonText}>FINALIZE PROTOCOL</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const StepPaywall = () => {
  const { completeOnboarding } = useOnboarding();
  const [billing, setBilling] = useState<'yearly' | 'monthly'>('yearly');
  const [completing, setCompleting] = useState(false);

  const perks = [
    'Unlimited Program Generation',
    'Advanced Body Tracking',
    'AI Form Assessment',
    'Priority Support',
    'Exclusive Content'
  ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.premiumIconContainer}>
        <LinearGradient
          colors={[colors.accent, colors.brandSecondary]}
          style={styles.iconGradient}
        >
          <Ionicons name="star" size={40} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Unlock your{'\n'}<Text style={styles.brandAccent}>Full Potential</Text></Text>
      
      <View style={styles.toggleContainer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.toggleButton, billing === 'yearly' && styles.toggleButtonActive]}
            onPress={() => setBilling('yearly')}
          >
            <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.toggleButton, billing === 'monthly' && styles.toggleButtonActive]}
            onPress={() => setBilling('monthly')}
          >
            <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.premiumCard}>
        <Text style={styles.premiumCardTitle}>Apex Elite</Text>
        <Text style={styles.premiumCardPrice}>{billing === 'yearly' ? '$129.99 / year' : '$12.99 / month'}</Text>
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 }} />
        {perks.map((p, i) => (
          <View key={i} style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={styles.perkText}>{p}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={async () => {
          setCompleting(true);
          try {
            await completeOnboarding();
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Failed to complete setup.');
            setCompleting(false);
          }
        }}
        disabled={completing}
      >
        <LinearGradient
          colors={[colors.accent, colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.brandButtonGradient, completing && { opacity: 0.6 }]}
        >
          {completing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.brandButtonText}>START 7-DAY FREE TRIAL</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={completeOnboarding}>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Restore Purchase</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function OnboardingScreen() {
  const { state, nextStep, prevStep } = useOnboarding();
  const progress = state.step / 15;

  const renderStep = () => {
    switch (state.step) {
      case 1:  return <StepWelcome onNext={nextStep} />;
      case 2:  return <StepFitnessGoal onNext={nextStep} />;
      case 3:  return <StepConsistency onNext={nextStep} onPrev={prevStep} />;
      case 4:  return <StepExperienceLevel onNext={nextStep} onPrev={prevStep} />;
      case 5:  return <StepEnvironment onNext={nextStep} onPrev={prevStep} />;
      case 6:  return <StepEquipment onNext={nextStep} onPrev={prevStep} />;
      case 7:  return <StepCalibrationIntro onNext={nextStep} onPrev={prevStep} />;
      case 8:  return <StepBestLifts onNext={nextStep} onPrev={prevStep} />;
      case 9:  return <StepWeeklyGoal onNext={nextStep} onPrev={prevStep} />;
      case 10: return <StepNotifications onNext={nextStep} onPrev={prevStep} />;
      case 11: return <StepBodyStats onNext={nextStep} onPrev={prevStep} />;
      case 12: return <StepReferral onNext={nextStep} onPrev={prevStep} />;
      case 13: return <StepFinalization onNext={nextStep} />;
      case 14: return <StepProgramSummary onNext={nextStep} onPrev={prevStep} />;
      case 15: return <StepPaywall />;
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ProgressBar progress={progress} />
          {renderStep()}
        </KeyboardAvoidingView>
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
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, lineHeight: 40 },
  brandAccent: { color: colors.brandPrimary, fontStyle: 'italic', fontWeight: '900' },
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
  optionCardSelected: { borderBottomColor: colors.brandPrimary + '40' },
  optionLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  optionLabelSelected: { color: colors.brandPrimary },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionIconContainerSelected: {
    backgroundColor: 'rgba(0,194,255,0.1)',
    borderColor: 'rgba(0,194,255,0.2)',
  },
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
  brandButtonGradient: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  textInput: { 
    flex: 1,
    color: colors.textPrimary, 
    fontSize: 20, 
    fontWeight: '700', 
    padding: 0,
    minHeight: 48,
  },
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
  premiumIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    marginTop: 60,
    marginBottom: 40,
    overflow: 'visible',
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  errorText: { color: '#FF4444', fontSize: 14, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  inputCardFocused: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: '45%',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: 'rgba(0,180,255,0.15)',
    borderColor: colors.brandPrimary,
  },
  genderOptionText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  genderOptionTextActive: {
    color: colors.brandPrimary,
  },
  genderDropdown: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderDropdownText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionActive: {
    backgroundColor: 'rgba(0,194,255,0.05)',
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: colors.brandPrimary,
    fontWeight: '700',
  },
  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dobField: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 56,
    justifyContent: 'center',
  },
  dobFieldFocused: {
    borderColor: colors.brandPrimary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dobInput: {
    color: colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '700',
    paddingVertical: 4,
  },
  dobSeparator: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
  liftInput: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    padding: 0,
  },
  summaryFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,194,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryFeatureText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  premiumCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,194,255,0.2)',
    marginTop: 20,
  },
  premiumCardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumCardPrice: {
    fontSize: 18,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  perkText: {
    fontSize: 15,
    color: colors.textPrimary,
    marginLeft: 12,
    fontWeight: '500',
  },
});
