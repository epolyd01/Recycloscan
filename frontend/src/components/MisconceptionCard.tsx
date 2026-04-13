import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, radii, spacing } from 'src/constants/theme';

interface MisconceptionCardProps {
  misconception: string;
  tip: string;
}

export default function MisconceptionCard({
  misconception,
  tip,
}: MisconceptionCardProps) {
  return (
    <View style={styles.container}>
      {/* Common Myths */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBg}>
            <MaterialIcons name="lightbulb" size={20} color={colors.secondary} />
          </View>
          <Text style={styles.sectionTitle}>Common Myths</Text>
        </View>
        <Text style={styles.body}>{misconception}</Text>
      </View>

      {/* Tip */}
      <View style={styles.tipRow}>
        <MaterialIcons name="tips-and-updates" size={16} color={colors.onTertiaryContainer} />
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  section: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontSizes.titleLg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  body: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: fontSizes.bodySm * 1.6,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radii.md,
    padding: spacing.base,
  },
  tipText: {
    flex: 1,
    fontSize: fontSizes.bodySm,
    fontWeight: '500',
    color: colors.onTertiaryContainer,
    lineHeight: fontSizes.bodySm * 1.5,
  },
});
