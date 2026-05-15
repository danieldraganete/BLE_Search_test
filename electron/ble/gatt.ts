// GATT Connection Manager
import { EventEmitter } from 'events';
import noble from '@stoprocent/noble';
import { GattService, GattCharacteristic, GattDescriptor, ConnectionInfo } from '../../src/types/ble-types';

let gattManagerInstance: GattManager | null = null;

export function getGattManager(): GattManager {
  if (!gattManagerInstance) {
    gattManagerInstance = new GattManager();
  }
  return gattManagerInstance;
}

export class GattManager extends EventEmitter {
  private connections = new Map<string, { connected: boolean; services: GattService[]; subscriptionHandles: Set<number> }>();

  async connect(deviceId: string): Promise<boolean> {
    try {
      await noble.connectAsync(deviceId);
      this.connections.set(deviceId, {
        connected: true,
        services: [],
        subscriptionHandles: new Set(),
      });
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.emit('error', `Failed to connect: ${err.message}`);
      return false;
    }
  }

  async disconnect(deviceId: string): Promise<void> {
    const conn = this.connections.get(deviceId);
    if (conn?.subscriptionHandles) {
      for (const handle of conn.subscriptionHandles) {
        try {
          noble.disableNotifications(handle);
        } catch (_e) {
          /* ignore */
        }
      }
    }
    noble.disconnect(deviceId);
    this.connections.delete(deviceId);
    this.emit('disconnect', deviceId);
  }

  async getServices(deviceId: string): Promise<GattService[]> {
    const services = await noble.discoverServicesAsync();
    const servicesMap = new Map<string, GattService>();

    for (const serviceData of services) {
      const characteristics = await this.getCharacteristics(deviceId, serviceData.uuid);
      const service = {
        uuid: serviceData.uuid,
        handle: serviceData.uuid,
        characteristics,
      } as unknown as GattService;
      servicesMap.set(service.uuid, service);
    }

    const result = Array.from(servicesMap.values());
    const conn = this.connections.get(deviceId);
    if (conn) conn.services = result;
    return result;
  }

  private async getCharacteristics(_deviceId: string, _serviceUuid: string): Promise<GattCharacteristic[]> {
    const characteristics = await noble.discoverCharacteristicsAsync(_serviceUuid);
    return characteristics.map((c) => ({
      uuid: c.uuid,
      handle: c.uuid,
      properties: c.properties,
      descriptors: c.descriptors,
      valueHex: null,
      subscribed: false,
    }));
  }
}
