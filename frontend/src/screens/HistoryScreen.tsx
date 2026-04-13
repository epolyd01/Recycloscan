import React, { useCallback, useRef } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useScanStore } from 'src/store/useScanStore';
import { ScanResult } from 'src/types/scan.types';
import { colors, fontSizes, radii, spacing } from 'src/constants/theme';

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Swipeable History Item ───────────────────────────────────────────────────

interface HistoryItemProps {
  item: ScanResult;
  onDelete: (id: string) => void;
}

function HistoryItem({ item, onDelete }: HistoryItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const DELETE_THRESHOLD = -80;

  function handleSwipeRelease() {
    if ((translateX as unknown as { _value: number })._value < DELETE_THRESHOLD) {
      Animated.timing(translateX, {
        toValue: -400,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDelete(item.id));
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }

  const deleteOpacity = translateX.interpolate({
    inputRange: [-120, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.itemWrapper}>
      {/* Delete background */}
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <MaterialIcons name="delete" size={24} color="#ffffff" />
        <Text style={styles.deleteLabel}>Delete</Text>
      </Animated.View>

      {/* Item card (swipeable) */}
      <Animated.View style={{ transform: [{ translateX }] }}>
        <Pressable
          style={styles.itemCard}
          onPress={() => {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }}
        >
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailFallback}>
                <MaterialIcons name="image" size={24} color={colors.onSurfaceVariant} />
              </View>
            )}
          </View>

          {/* Text */}
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.item}
            </Text>
            <Text style={styles.itemMeta}>{formatDate(item.scannedAt)}</Text>
          </View>

          {/* Badge */}
          <View
            style={[
              styles.badge,
              item.recyclable ? styles.badgeRecyclable : styles.badgeNot,
            ]}
          >
            <MaterialIcons
              name={item.recyclable ? 'recycling' : 'block'}
              size={20}
              color={item.recyclable ? colors.onPrimaryContainer : colors.onErrorContainer}
            />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <MaterialIcons name="history" size={40} color={colors.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>No scans yet</Text>
      <Text style={styles.emptyBody}>
        Items you scan will appear here. Head to the camera tab to get started.
      </Text>
    </View>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const history = useScanStore((state) => state.history);
  const deleteFromHistory = useScanStore((state) => state.deleteFromHistory);

  const renderItem = useCallback(
    ({ item }: { item: ScanResult }) => (
      <HistoryItem item={item} onDelete={deleteFromHistory} />
    ),
    [deleteFromHistory],
  );

  const keyExtractor = useCallback((item: ScanResult) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarContent}>
          <View style={styles.topBarLeft}>
            <MaterialIcons name="eco" size={22} color={colors.primary} />
            <Text style={styles.appTitle}>RecycloScan</Text>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="account-circle" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        data={history}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={[
          styles.listContent,
          history.length === 0 && styles.listContentEmpty,
        ]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.screenTitle}>Scan History</Text>
            {/* Filter chips */}
            <View style={styles.chipsRow}>
              <View style={[styles.chip, styles.chipActive]}>
                <Text style={styles.chipTextActive}>All Items</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Plastic</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Glass</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Paper</Text>
              </View>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
    paddingVertical: spacing.base,
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
  // ── List ──
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: spacing.xl,
  },
  listContentEmpty: {
    flex: 1,
  },
  listHeader: {
    paddingTop: spacing.xxl,
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  screenTitle: {
    fontSize: fontSizes.headlineLg,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  // ── Chips ──
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'nowrap',
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.full,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fontSizes.bodySm,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    fontSize: fontSizes.bodySm,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  // ── Item ──
  itemWrapper: {
    marginBottom: spacing.base,
    position: 'relative',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.error,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: spacing.xl,
    gap: spacing.sm,
  },
  deleteLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: fontSizes.bodySm,
  },
  itemCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
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
  thumbnailContainer: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    flexShrink: 0,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    fontSize: fontSizes.titleLg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  itemMeta: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeRecyclable: {
    backgroundColor: colors.primaryContainer,
  },
  badgeNot: {
    backgroundColor: `${colors.errorContainer}4d`,
  },
  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.base,
    marginTop: spacing.xxxl,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSizes.headlineSm,
    fontWeight: '700',
    color: colors.onSurface,
  },
  emptyBody: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: fontSizes.bodySm * 1.6,
  },
});
