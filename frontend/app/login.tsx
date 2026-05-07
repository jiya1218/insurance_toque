import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Missing Field', 'Please enter your email.'); return; }
    if (!password) { Alert.alert('Missing Field', 'Please enter your password.'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        Alert.alert('Login Failed', error.message);
      }
      // AuthContext onAuthStateChange handles redirect automatically
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero / Branding */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Ionicons name="shield-checkmark" size={40} color={Colors.white} />
          </View>
          <Text style={styles.brand}>Toque Insurance</Text>
          <Text style={styles.tagline}>Internal Management System</Text>
        </View>

        {/* Card — no Animated.View to avoid native crash */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
              <Ionicons
                name="mail-outline" size={18}
                color={emailFocused ? Colors.primary : Colors.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                testID="login-email"
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
              <Ionicons
                name="lock-closed-outline" size={18}
                color={passwordFocused ? Colors.primary : Colors.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                testID="login-password"
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                testID="toggle-password"
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textLight}
                />
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            testID="login-submit-btn"
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.signInBtnText}>Sign In</Text>
            }
          </Pressable>

          {/* Footer */}
          <View style={styles.footerWrap}>
            <Text style={styles.footer}>New Employee?</Text>
            <Pressable onPress={() => router.push('/onboarding')}>
              <Text style={styles.joinLink}>Join Torque Auto Advisor</Text>
            </Pressable>
          </View>
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0 · Internal Use Only</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.primary,
  },

  hero: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brand: {
    fontSize: FontSize.hero, fontWeight: '900', color: Colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs, letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
  },
  cardTitle: {
    fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSize.sm, color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },

  fieldGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1.2, marginBottom: Spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  inputWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1, fontSize: FontSize.md, color: Colors.text,
  },
  eyeBtn: { padding: Spacing.xs },

  signInBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInBtnText: {
    color: Colors.white, fontSize: FontSize.lg, fontWeight: '800', letterSpacing: 0.3,
  },

  footerWrap: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  footer: {
    fontSize: FontSize.xs, color: Colors.textLight,
  },
  joinLink: {
    fontSize: FontSize.sm, color: Colors.primary, fontWeight: '800',
  },
  version: {
    fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', marginTop: Spacing.xl,
  },
});
