import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../theme/theme';

export function GradientButton({ title, onPress, loading, style, colors, icon }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        disabled={loading}
      >
        <LinearGradient
          colors={colors || COLORS.gradientPrimary}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={styles.buttonContent}>
              {icon && <Ionicons name={icon} size={20} color={COLORS.white} style={{ marginRight: 8 }} />}
              <Text style={styles.gradientButtonText}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DarkInput({
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  onToggleSecure,
  showToggle,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  autoCapitalize,
}) {
  return (
    <View style={[styles.inputContainer, multiline && styles.inputMultiline, style]}>
      {icon && (
        <Ionicons name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
      )}
      <TextInput
        style={[styles.input, multiline && styles.inputTextMultiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize || 'none'}
        selectionColor={COLORS.primary}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggleSecure} style={styles.toggleButton}>
          <Ionicons
            name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function StatCard({ title, value, icon, gradient, index = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.statCardContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={gradient || COLORS.gradientPrimary}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={24} color={COLORS.white} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export function SettingsItem({ icon, label, onPress, danger, showChevron = true }) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsItemLeft}>
        <View style={[styles.settingsIconContainer, danger && styles.settingsIconDanger]}>
          <Ionicons name={icon} size={20} color={danger ? COLORS.error : COLORS.primary} />
        </View>
        <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>{label}</Text>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Gradient Button
  gradientButton: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...SHADOWS.medium,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },

  // Dark Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    minHeight: 52,
  },
  inputMultiline: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    paddingVertical: SPACING.md,
  },
  inputTextMultiline: {
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  toggleButton: {
    padding: SPACING.sm,
  },

  // Stat Card
  statCardContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  statCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  statValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    marginTop: SPACING.sm,
  },
  statTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop: 2,
  },

  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingsIconDanger: {
    backgroundColor: COLORS.error + '15',
  },
  settingsLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
  settingsLabelDanger: {
    color: COLORS.error,
  },
});
