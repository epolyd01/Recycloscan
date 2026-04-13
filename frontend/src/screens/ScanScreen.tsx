import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CameraViewClass from 'expo-camera/build/CameraView';
import { MaterialIcons } from '@expo/vector-icons';

import CameraViewComponent from 'src/components/CameraView';
import LoadingOverlay from 'src/components/LoadingOverlay';
import { useCamera } from 'src/hooks/useCamera';
import { useScanStore } from 'src/store/useScanStore';
import { scan } from 'src/services/api.service';
import { capturePhoto } from 'src/services/camera.service';
import { colors, fontSizes, radii, spacing, sizes } from 'src/constants/theme';
import { ScanStackParamList } from 'src/navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<ScanStackParamList, 'Scan'>;

export default function ScanScreen() {
  const navigation = useNavigation<NavProp>();
  const cameraRef = useRef<CameraViewClass>(null);
  const { permissionStatus, requestPermission } = useCamera();

  const isLoading = useScanStore((state) => state.isLoading);
  const setLoading = useScanStore((state) => state.setLoading);
  const setScanResult = useScanStore((state) => state.setScanResult);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanLineAnim]);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sizes.viewfinder],
  });

  const handleCameraReady = useCallback(() => setIsCameraReady(true), []);

  async function handleCapture() {
    if (isLoading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      let photoUri: string | null = null;
      if (isCameraReady && cameraRef.current) {
        try {
          const photo = await capturePhoto(
            cameraRef as React.RefObject<CameraViewClass>,
          );
          photoUri = photo.uri;
        } catch {
          // simulator / no hardware — fall through to mock
        }
      }
      const result = await scan(photoUri);
      setScanResult(result);
      navigation.navigate('Result');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Permission: denied ────────────────────────────────────────────────────

  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <MaterialIcons name="no-photography" size={48} color={colors.onSurfaceVariant} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionBody}>
          RecycloScan needs your camera to scan items. Please enable it in Settings.
        </Text>
      </SafeAreaView>
    );
  }

  // ── Permission: undetermined ──────────────────────────────────────────────

  if (permissionStatus === 'undetermined') {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <MaterialIcons name="photo-camera" size={48} color={colors.primary} />
        <Text style={styles.permissionTitle}>Enable Camera</Text>
        <Text style={styles.permissionBody}>
          RecycloScan needs your camera to identify recyclable items.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Main scan UI ──────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.topBarBg} />

      {/* ── Solid header — matches all other screens ── */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          {/* Left: logo + title */}
          <View style={styles.headerLeft}>
            <MaterialIcons name="eco" size={22} color={colors.primary} />
            <Text style={styles.appTitle}>RecycloScan</Text>
          </View>

          {/* Right: working flash toggle + info */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.headerButton, torchOn && styles.headerButtonActive]}
              onPress={() => setTorchOn((prev) => !prev)}
            >
              <MaterialIcons
                name={torchOn ? 'flash-on' : 'flash-off'}
                size={22}
                color={torchOn ? colors.primary : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setInfoVisible(true)}
            >
              <MaterialIcons name="info-outline" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Camera preview (fills screen below header) ── */}
      <View style={styles.cameraContainer}>
        <CameraViewComponent
          cameraRef={cameraRef as React.RefObject<CameraViewClass>}
          onCameraReady={handleCameraReady}
          torch={torchOn}
        />

        {/* Viewfinder scan-line animation */}
        <View style={styles.viewfinderOverlay} pointerEvents="none">
          <View style={styles.viewfinderBox}>
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          </View>
          <View style={styles.scanHintContainer}>
            <Text style={styles.scanHint}>Align object within frame</Text>
          </View>
        </View>

        {/* ── Bottom: error + scan button ── */}
        <View style={styles.bottomArea}>
          {errorMessage !== null && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={16} color={colors.onError} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.scanButton,
              (!isCameraReady || isLoading) && styles.scanButtonDisabled,
              pressed && isCameraReady && styles.scanButtonPressed,
            ]}
            onPress={handleCapture}
            disabled={isLoading}
          >
            <MaterialIcons name="photo-camera" size={36} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>

      {isLoading && <LoadingOverlay />}

      {/* ── Info modal ── */}
      <Modal
        visible={infoVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header row */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialIcons name="eco" size={22} color={colors.primary} />
                <Text style={styles.modalTitle}>How to Scan</Text>
              </View>
              <TouchableOpacity onPress={() => setInfoVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {INFO_TIPS.map((tip) => (
                <View key={tip.icon} style={styles.infoRow}>
                  <View style={styles.infoIconBg}>
                    <MaterialIcons name={tip.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoTextBlock}>
                    <Text style={styles.infoTipTitle}>{tip.title}</Text>
                    <Text style={styles.infoTipBody}>{tip.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const INFO_TIPS = [
  {
    icon: 'center-focus-strong',
    title: 'Align the item',
    body: 'Place the object inside the green frame. Make sure it fills most of the viewfinder for the best detection accuracy.',
  },
  {
    icon: 'wb-sunny',
    title: 'Use good lighting',
    body: 'Scan in a well-lit area. Use the flash toggle in the top-right if you\'re in a dark environment.',
  },
  {
    icon: 'photo-camera',
    title: 'Tap the button',
    body: 'Press the large green button at the bottom to capture and analyse the item. Hold the phone steady for a sharp photo.',
  },
  {
    icon: 'recycling',
    title: 'Read the verdict',
    body: 'RecycloScan will tell you if the item is recyclable, why, and the correct steps to dispose of it responsibly.',
  },
  {
    icon: 'history',
    title: 'Review past scans',
    body: 'Every scan is saved in the History tab. Swipe left on any item to delete it.',
  },
  {
    icon: 'lightbulb',
    title: 'Learn more',
    body: 'Visit the Education tab to bust common recycling myths and browse materials by category.',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inverseSurface,
  },

  // ── Permission screens ──
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.base,
  },
  permissionTitle: {
    fontSize: fontSizes.headlineSm,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: spacing.base,
  },
  permissionBody: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: fontSizes.bodySm * 1.5,
  },
  permissionButton: {
    marginTop: spacing.base,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radii.full,
  },
  permissionButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: fontSizes.bodyLg,
  },

  // ── Header ──
  header: {
    backgroundColor: colors.topBarBg,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  headerContent: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  headerLeft: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonActive: {
    backgroundColor: colors.primaryContainer,
  },

  // ── Camera container ──
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },

  // ── Viewfinder overlay ──
  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  viewfinderBox: {
    width: sizes.viewfinder,
    height: sizes.viewfinder,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primaryContainer,
    opacity: 0.8,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  scanHintContainer: {
    marginTop: spacing.xxl,
  },
  scanHint: {
    backgroundColor: colors.scanLabelBg,
    color: '#ffffff',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    fontSize: fontSizes.bodySm,
    fontWeight: '500',
    overflow: 'hidden',
  },

  // ── Bottom area ──
  bottomArea: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
    zIndex: 20,
  },
  scanButton: {
    width: sizes.scanButton,
    height: sizes.scanButton,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.scanButtonRing,
    borderColor: 'rgba(255,255,255,0.3)',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  scanButtonPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.85,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorContainer,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    width: '100%',
  },
  errorText: {
    color: colors.onError,
    fontSize: fontSizes.bodySm,
    fontWeight: '500',
    flex: 1,
  },

  // ── Info modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.base,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSizes.headlineSm,
    fontWeight: '700',
    color: colors.onSurface,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTipTitle: {
    fontSize: fontSizes.bodyLg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  infoTipBody: {
    fontSize: fontSizes.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: fontSizes.bodySm * 1.55,
  },
});
