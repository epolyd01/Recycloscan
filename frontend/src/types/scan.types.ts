export interface ScanResult {
  id: string;
  item: string;
  recyclable: boolean;
  confidence: number;
  reason: string;
  tip: string;
  misconception: string | null;
  imageUri: string;
  scannedAt: string;
}
