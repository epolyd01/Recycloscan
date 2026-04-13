import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView as ExpoCameraView } from 'expo-camera';
import CameraView from 'expo-camera/build/CameraView';
import { colors, sizes } from 'src/constants/theme';

interface CameraViewProps {
  cameraRef: React.RefObject<CameraView>;
  onCameraReady?: () => void;
  torch?: boolean;
}

export default function CameraViewComponent({
  cameraRef,
  onCameraReady,
  torch = false,
}: CameraViewProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <ExpoCameraView
        ref={cameraRef as React.RefObject<ExpoCameraView>}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={onCameraReady}
        enableTorch={torch}
      />
      {/* Viewfinder corners */}
      <View style={styles.viewfinderContainer} pointerEvents="none">
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>
    </View>
  );
}

const CORNER = sizes.viewfinderCorner;
const BORDER = sizes.viewfinderBorder;

const styles = StyleSheet.create({
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: sizes.viewfinder,
    height: sizes.viewfinder,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.primaryContainer,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
    borderTopLeftRadius: 20,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER,
    borderRightWidth: BORDER,
    borderTopRightRadius: 20,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER,
    borderLeftWidth: BORDER,
    borderBottomLeftRadius: 20,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER,
    borderRightWidth: BORDER,
    borderBottomRightRadius: 20,
  },
});
