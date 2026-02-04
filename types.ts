
export type AppMode = 'HOME' | 'SENDER' | 'RECEIVER';

export enum TransferType {
  P2P = 'P2P',
  CLOUD = 'CLOUD'
}

export interface SharedFileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface QRData {
  hostId: string;
  transferType: TransferType;
  meta: SharedFileMetadata[];
  cloudUrl?: string;
}

export interface PeerMessage {
  type: 'META' | 'FILE' | 'CHUNK';
  payload: any;
}
