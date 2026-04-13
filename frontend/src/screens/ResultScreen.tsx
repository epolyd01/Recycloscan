import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import ResultCard from 'src/components/ResultCard';
import MisconceptionCard from 'src/components/MisconceptionCard';
import { useScanStore } from 'src/store/useScanStore';
import { colors, fontSizes, radii, spacing } from 'src/constants/theme';
import { ScanStackParamList } from 'src/navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<ScanStackParamList, 'Result'>;

const RECYCLING_STEPS = [
  'Empty all liquids completely.',
  'Crush the bottle to save space.',
  'Screw the cap back on (usually accepted).',
];

export default function ResultScreen() {
  const navigation = useNavigation<NavProp>();
  const currentScan = useScanStore((state) => state.currentScan);

  if (!currentScan) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <MaterialIcons name="search-off" size={48} color={colors.onSurfaceVariant} />
        <Text style={styles.emptyText}>No scan result available.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity
          style={styles.backButtonRow}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <MaterialIcons name="eco" size={22} color={colors.primary} />
          <Text style={styles.appTitle}>RecycloScan</Text>
        </View>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: currentScan.imageUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBottom}>
            <View style={styles.detectionChip}>
              <Text style={styles.detectionChipText}>
                Detected: {currentScan.item}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ResultCard
            recyclable={currentScan.recyclable}
            confidence={currentScan.confidence}
            reason={currentScan.reason}
          />

          {currentScan.misconception !== null && (
            <MisconceptionCard
              misconception={currentScan.misconception}
              tip={currentScan.tip}
            />
          )}

          {/* Recycling steps */}
          <View style={styles.stepsSection}>
            <Text style={styles.stepsTitle}>Recycling Steps</Text>
            <View style={styles.stepsList}>
              {RECYCLING_STEPS.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Better alternatives */}
          <View style={styles.alternativesCard}>
            <View style={styles.alternativesContent}>
              <Text style={styles.alternativesTitle}>
                <MaterialIcons name="eco" size={18} color={colors.primary} />{' '}
                Better Alternatives
              </Text>
              <Text style={styles.alternativesBody}>
                Consider a reusable glass bottle. It lasts longer, doesn't leach
                chemicals, and is infinitely recyclable.
              </Text>
              <TouchableOpacity style={styles.alternativesButton}>
                <Text style={styles.alternativesButtonText}>
                  Shop Sustainable
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.alternativesDecoration} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSizes.bodyLg,
    color: colors.onSurfaceVariant,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radii.full,
    marginTop: spacing.base,
  },
  backButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: fontSizes.bodyLg,
  },
  // ── Top bar ──
  topBar: {
    backgroundColor: colors.topBarBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  backButtonRow: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  appTitle: {
    fontSize: fontSizes.headlineMd,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // ── Hero ──
  heroContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroBottom: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
  },
  detectionChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
  },
  detectionChipText: {
    fontSize: fontSizes.labelLg,
    fontWeight: '700',
    color: colors.onTertiaryContainer,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // ── Content ──
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.base,
  },
  // ── Recycling steps ──
  stepsSection: {
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  stepsTitle: {
    fontSize: fontSizes.titleLg,
    fontWeight: '700',
    color: colors.onSurface,
    paddingHorizontal: spacing.xs,
  },
  stepsList: {
    gap: spacing.base,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.base,
    borderRadius: radii.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
      },
      android: { elevation: 1 },
    }),
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: fontSizes.labelLg,
    fontWeight: '700',
    color: colors.onTertiaryContainer,
  },
  stepText: {
    fontSize: fontSizes.bodySm,
    fontWeight: '500',
    color: colors.onSurface,
    flex: 1,
  },
  // ── Alternatives card ──
  alternativesCard: {
    backgroundColor: `${colors.surfaceContainerHighest}80`,
    borderRadius: radii.md,
    padding: spacing.xxl,
    overflow: 'hidden',
    position: 'relative',
  },
  alternativesContent: {
    gap: spacing.base,
    zIndex: 1,
  },
  alternativesTitle: {
    fontSize: fontSizes.headlineSm,
    fontWeight: '700',
    color: colors.primary,
  },
  alternativesBody: {
    fontSize: fontSizes.bodyLg,
    color: colors.onSurfaceVariant,
    lineHeight: fontSizes.bodyLg * 1.6,
    maxWidth: '80%',
  },
  alternativesButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  alternativesButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: fontSizes.bodySm,
  },
  alternativesDecoration: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 160,
    height: 160,
    borderRadius: radii.full,
    backgroundColor: `${colors.primaryContainer}4d`,
  },
});
