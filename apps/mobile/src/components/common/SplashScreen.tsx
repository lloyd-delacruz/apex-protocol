import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('screen');

/**
 * Splash / Landing Screen
 *
 * Used in two contexts:
 *   1. As a loading splash (showButtons=false) — no navigation needed, rendered
 *      directly by RootNavigator while auth state resolves.
 *   2. As the Landing screen (showButtons=true) — inside AuthNavigator; navigation
 *      prop is passed explicitly from the Stack.Screen render prop.
 *
 * Navigation is intentionally a prop (not useNavigation) so this component is safe
 * to render outside a Navigator context.
 */
interface SplashScreenProps {
  showButtons?: boolean;
  navigation?: NativeStackNavigationProp<AuthStackParamList>;
}

export const SplashScreen = ({ showButtons = false, navigation }: SplashScreenProps) => {
  const insets = useSafeAreaInsets();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.93)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;
  const btnFade   = useRef(new Animated.Value(0)).current;
  const btnSlide  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Stage 1 — fade + scale logo in (fast, premium feel)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 10,
        tension: 55,
        useNativeDriver: true,
      }),
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2 — reveal CTA buttons after logo settles
    if (showButtons) {
      Animated.sequence([
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(btnFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(btnSlide, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bottomPad = Math.max(insets.bottom + 16, 48);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Full-screen gradient background ── */}
      <LinearGradient
        colors={['#06060A', '#0A0A14', '#06060A']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Diagonal accent planes (very subtle) ── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}
      >
        <Svg
          height={height}
          width={width}
          viewBox={`0 0 ${width} ${height}`}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <SvgGradient id="tr" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.brandPrimary} stopOpacity="0.13" />
              <Stop offset="100%" stopColor={colors.brandSecondary} stopOpacity="0" />
            </SvgGradient>
            <SvgGradient id="bl" x1="100%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor={colors.brandPrimary} stopOpacity="0.09" />
              <Stop offset="100%" stopColor={colors.brandSecondary} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          {/* top-right sweep */}
          <Path
            d={`M${width * 0.4} 0 L${width} 0 L${width} ${height * 0.52} Z`}
            fill="url(#tr)"
          />
          {/* bottom-left sweep */}
          <Path
            d={`M0 ${height * 0.48} L0 ${height} L${width * 0.6} ${height} Z`}
            fill="url(#bl)"
          />
        </Svg>
      </Animated.View>

      {/* ── Centered logo + wordmark ── */}
      <Animated.View
        style={[
          styles.center,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../assets/apex-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>APEX PROTOCOL</Text>
        <Text style={styles.tagline}>TRAIN WITH PURPOSE</Text>
      </Animated.View>

      {/* ── CTA Buttons (Landing mode only) ── */}
      {showButtons && (
        <Animated.View
          style={[
            styles.footer,
            {
              paddingBottom: bottomPad,
              opacity: btnFade,
              transform: [{ translateY: btnSlide }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation?.navigate('Login')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.brandPrimary, colors.brandSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <Text style={styles.primaryBtnText}>GET STARTED</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation?.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>SIGN IN</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06060A',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 0,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  title: {
    color: '#F0F0F5',
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 5,
    marginTop: 16,
    textShadowColor: 'rgba(0, 194, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  tagline: {
    color: 'rgba(160, 160, 176, 0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 10,
  },
  footer: {
    paddingHorizontal: 32,
    gap: 14,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  gradientBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#06060A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  secondaryBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  secondaryBtnText: {
    color: 'rgba(240, 240, 245, 0.9)',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
