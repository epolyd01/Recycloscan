import * as ImageManipulator from 'expo-image-manipulator';
import CameraView from 'expo-camera/build/CameraView';
import { RefObject } from 'react';

export interface CaptureResult {
  uri: string;
  width: number;
  height: number;
}

export async function capturePhoto(
  cameraRef: RefObject<CameraView>,
): Promise<CaptureResult> {
  if (!cameraRef.current) {
    throw new Error('Camera is not ready.');
  }

  const photo = await cameraRef.current.takePictureAsync();

  if (!photo) {
    throw new Error('Failed to capture photo.');
  }

  return { uri: photo.uri, width: photo.width, height: photo.height };
}

export async function compressForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
