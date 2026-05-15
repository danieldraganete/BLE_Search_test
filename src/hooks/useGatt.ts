import { useCallback } from 'react';
import { useGattStore } from '@/stores/gattStore';
import { GattService, GattCharacteristic } from '@/types/ble-types';

export function useGatt() {
  const {
    services,
    connected,
    connecting,
    connectedDeviceId,
    subscriptionHandles,
    notifications,
    setServices,
    setConnected,
    setConnecting,
    setConnectedDeviceId,
    subscribeCharacteristic,
    unsubscribeCharacteristic,
    addNotification,
    clearNotifications,
    clear,
  } = useGattStore();

  const connect = useCallback(
    (deviceId: string) => {
      setConnecting(true);
      setConnectedDeviceId(deviceId);
    },
    [setConnecting, setConnectedDeviceId]
  );

  const disconnect = useCallback(() => {
    setConnected(false);
    setConnecting(false);
    clear();
  }, [setConnected, setConnecting, clear]);

  const scanServices = useCallback(
    (services: GattService[]) => {
      setServices(services);
    },
    [setServices]
  );

  const readCharacteristic = useCallback(async (char: GattCharacteristic): Promise<string | null> => {
    return char.valueHex;
  }, []);

  const writeCharacteristic = useCallback(
    async (char: GattCharacteristic, hexData: string): Promise<boolean> => {
      return true;
    },
    []
  );

  return {
    services,
    connected,
    connecting,
    connectedDeviceId,
    subscriptionHandles,
    notifications,
    connect,
    disconnect,
    scanServices,
    readCharacteristic,
    writeCharacteristic,
    subscribeCharacteristic,
    unsubscribeCharacteristic,
    addNotification,
    clearNotifications,
    clear,
  };
}
