export type AppMode = 'HOME' | 'SENDER' | 'RECEIVER';

export interface SharedFileMetadata {
  name: string;
  size: number;
  type: string;
  cloudUrl: string;
}

export interface QRData {
  version: string;
  files: SharedFileMetadata[];
  timestamp: number;
}