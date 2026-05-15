export interface Advertisement {
  uuids: string[];
  name: string | null;
  rssi: number;
  txPowerLevel: number | null;
  manufacturerData: ManufacturerData[];
  serviceData: ServiceData[];
  raw: string;
}

export interface ManufacturerData {
  type: string;
  data: string;
  companyId: number;
  companyName?: string;
}

export interface ServiceData {
  uuid: string;
  data: string;
}

export interface ScanAdvertisement {
  id: string;
  address: string;
  addressType: string;
  connectable: boolean;
  advertisements: Advertisement;
  timestamp: number;
}

export interface BleDevice {
  id: string;
  address: string;
  addressType: string;
  name: string | null;
  rssi: number;
  rssiHistory: RssiEntry[];
  isFavorite: boolean;
  isConnected: boolean;
  advertisementCount: number;
  firstSeen: number;
  lastSeen: number;
  connectable: boolean;
  advertisement: Advertisement | null;
  uuids?: string[];
  estimatedInterval?: number;
  notes?: string;
}

export interface RssiEntry {
  rssi: number;
  timestamp: number;
}

export interface ScanSession {
  startedAt: number;
  stoppedAt: number | null;
  deviceCount: number;
  totalAdvertisements: number;
  devices: Map<string, BleDevice>;
}

export interface GattService {
  uuid: string;
  handle: number;
  include: number[];
  characteristics: GattCharacteristic[];
}

export interface GattCharacteristic {
  uuid: string;
  handle: number;
  valueHandle: number;
  properties: string[];
  descriptors: GattDescriptor[];
  valueHex: string | null;
  subscribed: boolean;
}

export interface GattDescriptor {
  uuid: string;
  handle: number;
  valueHex: string | null;
}

export interface ConnectionInfo {
  deviceId: string;
  connected: boolean;
  mtu: number;
  connectionEncrypted: boolean;
  latency: number;
}

export interface GattWriteResult {
  success: boolean;
  dataSent: number;
}
