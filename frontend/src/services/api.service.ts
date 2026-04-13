import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { ScanResult } from 'src/types/scan.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function compressImage(imageUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

// ─── Scan ────────────────────────────────────────────────────────────────────

export async function scan(imageUri: string | null): Promise<ScanResult> {
  if (!imageUri) throw new Error('No image to scan.');

  const compressedUri = await compressImage(imageUri);

  const formData = new FormData();
  formData.append('file', {
    uri: compressedUri,
    name: 'scan.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const { data } = await apiClient.post<
    Omit<ScanResult, 'id' | 'imageUri' | 'scannedAt'>
  >('/api/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return {
    ...data,
    id: generateId(),
    imageUri: compressedUri,
    scannedAt: new Date().toISOString(),
  };
}

// ─── Education ───────────────────────────────────────────────────────────────

export interface EducationItem {
  id: string;
  title: string;
  myth: string;
  fact: string;
  category: string;
}

export async function getEducation(): Promise<EducationItem[]> {
  const { data } = await apiClient.get<EducationItem[]>('/api/education');
  return data;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryItem extends Omit<ScanResult, 'imageUri'> {
  id: number;
  scanned_at: string;
}

export async function getHistory(
  limit = 50,
  offset = 0,
): Promise<HistoryItem[]> {
  const { data } = await apiClient.get<HistoryItem[]>('/api/history', {
    params: { limit, offset },
  });
  return data;
}

export async function deleteHistory(id: number): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete<{ deleted: boolean }>(
    `/api/history/${id}`,
  );
  return data;
}

export default apiClient;
