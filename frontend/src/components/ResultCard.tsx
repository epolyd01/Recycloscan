import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, radii, spacing } from 'src/constants/theme';

interface ResultCardProps {
  recyclable: boolean;
  confidence: number;
  reason: string;
}

export default function ResultCard({
  recyclable,
  confidence,
  reason,
}: ResultCardProps) {
  const confidencePct = Math.round(confidence * 100);

  return (
    <>
      {/* Verdict banner */}
      <View
        style={[
          styles.verdictBanner,
          recyclable ? styles.verdictBannerRecyclable : styles.verdictBannerNot,
        ]}
      >
        <Text style={styles.verdictLabel}>Verdict</Text>
        <Text
          style={[
            styles.verdictText,
            recyclable ? styles.verdictTextRecyclable : styles.verdictTextNot,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {recyclable ? 'RECYCLABLE' : 'NOT RECYCLABLE'}
        </Text>

        <View style={styles.confidenceRow}>
          <MaterialIcons
            name="analytics"
            size={14}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.confidenceText}>
            {confidencePct}% confidence
          </Text>
        </View>
      </View>

      {/* Why card */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <View style={styles.infoIconBg}>
            <MaterialIcons name="help" size={20} color={colors.primary} />
          </View>
          <Text style={styles.infoCardTitle}>Why?</Text>
        </View>
        <Text style={styles.infoCardBody}>{reason}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  verdictBanner: {
    borderRadius: radii.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 2,
  },
  verdictBannerRecyclable: {
    backgroundColor: `${colors.primaryContainer}66`,
    borderColor: `${colors.primary}1a`,
  },
  verdictBannerNot: {
    backgroundColor: `${colors.errorContainer}33`,
    borderColor: `${colors.error}1a`,
  },
  verdictLabel: {
    fontSize: fontSizes.bodySm,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  verdictText: {
    fontSize: fontSizes.displayMd,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  verdictTextRecyclable: {
    color: colors.primary,
  },
  verdictTextNot: {
    color: colors.error,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  confidenceText: {
    fontSize: fontSizes.labelLg,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: fontSizes.titleLg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  infoCardBody: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: fontSizes.bodySm * 1.6,
  },
});
