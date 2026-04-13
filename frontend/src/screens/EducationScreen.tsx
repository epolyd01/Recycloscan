import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { EDUCATION_ITEMS, EDUCATION_FACTS, EducationItem } from 'src/data/education';
import { colors, fontSizes, radii, spacing } from 'src/constants/theme';

// ─── Category config ──────────────────────────────────────────────────────────

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const CATEGORY_CONFIG: Record<
  EducationItem['category'],
  { icon: MaterialIconName; label: string }
> = {
  plastic: { icon: 'opacity', label: 'Plastic' },
  paper: { icon: 'description', label: 'Paper' },
  glass: { icon: 'local-bar', label: 'Glass' },
  metal: { icon: 'hardware', label: 'Metal' },
  general: { icon: 'eco', label: 'General' },
};

// ─── Myth-Fact Card ───────────────────────────────────────────────────────────

interface MythFactCardProps {
  item: EducationItem;
}

function MythFactCard({ item }: MythFactCardProps) {
  return (
    <View style={styles.mythCard}>
      {/* Myth */}
      <View style={styles.mythSection}>
        <View style={styles.mythIconBg}>
          <MaterialIcons name="close" size={18} color={colors.error} />
        </View>
        <View style={styles.mythTextContainer}>
          <Text style={styles.mythLabel}>THE MYTH</Text>
          <Text style={styles.mythText}>"{item.myth}"</Text>
        </View>
      </View>

      {/* Fact */}
      <View style={styles.factSection}>
        <View style={styles.factIconBg}>
          <MaterialIcons name="check" size={18} color={colors.primary} />
        </View>
        <View style={styles.factTextContainer}>
          <Text style={styles.factLabel}>THE FACT</Text>
          <Text style={styles.factText}>{item.fact}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: EducationItem['category'];
  count: number;
  wide?: boolean;
}

function CategoryCard({ category, count, wide }: CategoryCardProps) {
  const config = CATEGORY_CONFIG[category];
  return (
    <View style={[styles.categoryCard, wide && styles.categoryCardWide]}>
      <View style={styles.categoryIconBg}>
        <MaterialIcons name={config.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.categoryTextContainer}>
        <Text style={styles.categoryLabel}>{config.label}</Text>
        <Text style={styles.categoryMeta}>
          {count} Lesson{count !== 1 ? 's' : ''}
        </Text>
      </View>
      {wide && (
        <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
      )}
    </View>
  );
}

// ─── Education Screen ─────────────────────────────────────────────────────────

export default function EducationScreen() {
  const dailyFact = EDUCATION_FACTS[0];
  const mythItems = EDUCATION_ITEMS;

  const countByCategory = (cat: EducationItem['category']) =>
    EDUCATION_ITEMS.filter((i) => i.category === cat).length;

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarContent}>
          <View style={styles.topBarLeft}>
            <MaterialIcons name="eco" size={22} color={colors.primary} />
            <Text style={styles.appTitle}>RecycloScan</Text>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity>
              <MaterialIcons name="search" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="account-circle" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Did You Know?</Text>
          <Text style={styles.heroSubtitle}>
            Discover the impact of your daily choices and master the art of
            conscious living.
          </Text>
          <View style={styles.heroDecoration} />
        </View>

        {/* Featured impact card */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredContent}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Daily Fact</Text>
            </View>
            <Text style={styles.featuredStat}>{dailyFact.stat}</Text>
            <Text style={styles.featuredDescription}>
              {dailyFact.description}
            </Text>
            <TouchableOpacity style={styles.featuredButton}>
              <Text style={styles.featuredButtonText}>Learn More</Text>
              <MaterialIcons name="arrow-forward" size={14} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.featuredDecoration} />
        </View>

        {/* Browse by material */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Material</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryGrid}>
            <CategoryCard
              category="plastic"
              count={countByCategory('plastic')}
            />
            <CategoryCard category="paper" count={countByCategory('paper')} />
            <CategoryCard
              category="glass"
              count={countByCategory('glass') + countByCategory('metal')}
              wide
            />
          </View>
        </View>

        {/* Myth vs Fact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Myth vs. Fact</Text>
          <View style={styles.mythList}>
            {mythItems.map((item) => (
              <MythFactCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Pro tip */}
        <View style={styles.proTip}>
          <MaterialIcons
            name="lightbulb"
            size={28}
            color={colors.onTertiaryContainer}
          />
          <View style={styles.proTipText}>
            <Text style={styles.proTipTitle}>Pro Tip</Text>
            <Text style={styles.proTipBody}>
              Rinsing containers prevents contamination and keeps recycling
              centres smelling fresh.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Top bar ──
  topBar: {
    backgroundColor: colors.topBarBg,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    height: 64,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appTitle: {
    fontSize: fontSizes.headlineMd,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // ── Hero ──
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: fontSizes.displayLg,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: spacing.sm,
    lineHeight: fontSizes.displayLg * 1.1,
  },
  heroSubtitle: {
    fontSize: fontSizes.bodyLg,
    color: colors.onSurfaceVariant,
    lineHeight: fontSizes.bodyLg * 1.5,
    maxWidth: '80%',
  },
  heroDecoration: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 96,
    height: 96,
    borderRadius: radii.full,
    backgroundColor: colors.tertiaryContainer,
    opacity: 0.3,
  },
  // ── Featured card ──
  featuredCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.md,
    padding: spacing.xxl,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
    }),
  },
  featuredContent: {
    gap: spacing.base,
    zIndex: 1,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  featuredStat: {
    fontSize: fontSizes.headlineLg,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
    lineHeight: fontSizes.headlineLg * 1.2,
  },
  featuredDescription: {
    fontSize: fontSizes.bodySm,
    color: `${colors.onPrimaryContainer}cc`,
    lineHeight: fontSizes.bodySm * 1.6,
  },
  featuredButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    marginTop: spacing.xs,
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
  featuredButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: fontSizes.bodySm,
  },
  featuredDecoration: {
    position: 'absolute',
    bottom: -32,
    left: -32,
    width: 128,
    height: 128,
    borderRadius: radii.full,
    backgroundColor: `${colors.primaryDim}1a`,
  },
  // ── Sections ──
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: fontSizes.headlineSm,
    fontWeight: '700',
    color: colors.onSurface,
  },
  sectionAction: {
    fontSize: fontSizes.bodySm,
    fontWeight: '600',
    color: colors.primary,
  },
  // ── Category grid ──
  categoryGrid: {
    gap: spacing.base,
  },
  categoryCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.lg,
    height: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  categoryCardWide: {
    height: 72,
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: `${colors.primary}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: fontSizes.titleLg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  categoryMeta: {
    fontSize: fontSizes.labelLg,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  // ── Myth cards ──
  mythList: {
    gap: spacing.base,
  },
  mythCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  mythSection: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.base,
  },
  mythIconBg: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: `${colors.errorContainer}33`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mythTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  mythLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.error,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mythText: {
    fontSize: fontSizes.bodySm,
    fontWeight: '600',
    color: colors.onSurface,
    lineHeight: fontSizes.bodySm * 1.5,
  },
  factSection: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.base,
    backgroundColor: `${colors.secondaryContainer}4d`,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
  },
  factIconBg: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  factTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  factText: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: fontSizes.bodySm * 1.5,
  },
  // ── Pro tip ──
  proTip: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radii.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
  },
  proTipText: {
    flex: 1,
    gap: spacing.xs,
  },
  proTipTitle: {
    fontSize: fontSizes.bodyLg,
    fontWeight: '700',
    color: colors.onTertiaryContainer,
  },
  proTipBody: {
    fontSize: fontSizes.bodySm,
    color: `${colors.onTertiaryContainer}cc`,
    lineHeight: fontSizes.bodySm * 1.5,
  },
});
