export type AppMode = 'HOME' | 'SENDER' | 'RECEIVER';

export enum TransferType {
  P2P = 'P2P',
  CLOUD = 'CLOUD'
}

export interface SharedFileMetadata {
  name: string;
  size: number;
  type: string;
  cloudUrl?: string; // Added for Cloudinary integration
  index?: number;    // Added for batch tracking
}

export interface QRData {
  hostId: string;
  transferType: TransferType;
  meta: SharedFileMetadata[];
}

export interface PeerMessage {
  type: 'BATCH_START' | 'META' | 'FILE' | 'CHUNK';
  payload: any;
}