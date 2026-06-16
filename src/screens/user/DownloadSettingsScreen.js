import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../theme/theme';

const DownloadSettingsScreen = ({ navigation }) => {
  const [wifiOnly, setWifiOnly] = useState(true);
  const [quality, setQuality] = useState('Medium');

  const qualities = ['High', 'Medium', 'Low'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Download Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Network</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Download over Wi-Fi only</Text>
              <Text style={styles.settingDesc}>Save cellular data usage</Text>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={setWifiOnly}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Video Quality</Text>
        <View style={styles.card}>
          {qualities.map((q, index) => (
            <React.Fragment key={q}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setQuality(q)}
                activeOpacity={0.7}
              >
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{q}</Text>
                  <Text style={styles.settingDesc}>
                    {q === 'High' ? 'Best video quality, uses more storage' : 
                     q === 'Medium' ? 'Good quality, balanced storage usage' : 
                     'Basic quality, uses least storage'}
                  </Text>
                </View>
                <View style={styles.radioOuter}>
                  {quality === q && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
              {index < qualities.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  settingInfo: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.lg,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
});

export default DownloadSettingsScreen;
