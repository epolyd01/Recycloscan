import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, spacing } from 'src/constants/theme';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({
  message = 'Analysing item…',
}: LoadingOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scanOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    gap: spacing.base,
    ...{
      shadowColor: colors.onSurface,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
    },
  },
  message: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
});
