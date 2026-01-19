import { useState, useCallback } from "react";
import type { DeviceInfo } from "../types/bluetooth";
import {
  BLUETOOTH_SERVICES,
  CHARACTERISTICS,
  handleBluetoothError,
} from "../utils/bluetooth";

export function useBluetooth() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<DeviceInfo | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);
  const [power, setPower] = useState<number | null>(0);
  const [cadence, setCadence] = useState<number | null>(0);
  const [heartRate, setHeartRate] = useState<number | null>(0);
  const [historicalPowerData, setHistoricalPowerData] = useState<number[]>([]);
  const [historicalCadenceData, setHistoricalCadenceData] = useState<number[]>(
    []
  );
  const [historicalHeartRateData, setHistoricalHeartRateData] = useState<
    number[]
  >([]);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [startNotifications, setStartNotifications] = useState<
    (() => void) | null
  >(null);
  const [stopNotifications, setStopNotifications] = useState<
    (() => void) | null
  >(null);

  const checkSupport = useCallback(() => {
    if (typeof window !== "undefined" && navigator.bluetooth) {
      setIsSupported(true);
      setError(null);
    } else {
      setIsSupported(false);
      setError(
        "Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Opera."
      );
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    if (!isSupported || !navigator.bluetooth) {
      checkSupport();
      return;
    }

    setIsScanning(true);
    setError(null);
    setDevices([]);

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          BLUETOOTH_SERVICES.FTM,
          BLUETOOTH_SERVICES.POWER,
          BLUETOOTH_SERVICES.CADENCE,
          BLUETOOTH_SERVICES.HEART_RATE,
          BLUETOOTH_SERVICES.DEVICE_INFO,
        ],
      });

      const deviceInfo: DeviceInfo = {
        id: device.id,
        name: device.name || "Unknown Device",
        device: device,
      };

      setDevices([deviceInfo]);
      setIsScanning(false);
    } catch (err: unknown) {
      setIsScanning(false);
      setError(handleBluetoothError(err));
    }
  }, [isSupported, checkSupport]);

  const getCharacteristic = async (
    service: BluetoothRemoteGATTService,
    characteristicId: number
  ): Promise<BluetoothRemoteGATTCharacteristic | null> => {
    try {
      return await service.getCharacteristic(characteristicId);
    } catch {
      return null;
    }
  };

  const readCharacteristic = async (
    service: BluetoothRemoteGATTService,
    characteristicId: number
  ): Promise<string | null> => {
    try {
      const characteristic = await service.getCharacteristic(characteristicId);
      const value = await characteristic.readValue();
      const decoder = new TextDecoder();
      return decoder.decode(value);
    } catch {
      return null;
    }
  };

  const setupCadenceNotifications = async (
    cadenceService: BluetoothRemoteGATTService,
    onCadenceUpdate: (cadence: number) => void
  ) => {
    try {
      const cadenceChar = await cadenceService.getCharacteristic(
        CHARACTERISTICS.CSC
      );
      cadenceChar.addEventListener("characteristicvaluechanged", (e) => {
        const target = e.target as BluetoothRemoteGATTCharacteristic;
        const value = (
          target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
        ).value;
        if (!value) return;
        const dv = new DataView(value.buffer);
        const cadence = dv.getUint8(1); // Cadence is typically at offset 1
        onCadenceUpdate(cadence);
      });

      const charWithNotifications =
        cadenceChar as BluetoothRemoteGATTCharacteristic & {
          startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
          stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
        };

      return {
        stopNotifications: () => {
          charWithNotifications.stopNotifications().catch(console.error);
        },
        startNotifications: () => {
          charWithNotifications.startNotifications().catch(console.error);
        },
      };
    } catch (e) {
      console.error(e);
      return { stopNotifications: null, startNotifications: null };
    }
  };

  const setupHeartRateNotifications = async (
    heartRateService: BluetoothRemoteGATTService,
    onHeartRateUpdate: (heartRate: number) => void
  ) => {
    try {
      const heartRateChar = await heartRateService.getCharacteristic(
        CHARACTERISTICS.HEART_RATE
      );
      heartRateChar.addEventListener("characteristicvaluechanged", (e) => {
        const target = e.target as BluetoothRemoteGATTCharacteristic;
        const value = (
          target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
        ).value;
        if (!value) return;
        const dv = new DataView(value.buffer);
        const heartRate = dv.getUint8(1); // Heart rate is typically at offset 1
        onHeartRateUpdate(heartRate);
      });

      const charWithNotifications =
        heartRateChar as BluetoothRemoteGATTCharacteristic & {
          startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
          stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
        };

      return {
        stopNotifications: () => {
          charWithNotifications.stopNotifications().catch(console.error);
        },
        startNotifications: () => {
          charWithNotifications.startNotifications().catch(console.error);
        },
      };
    } catch (e) {
      console.error(e);
      return { stopNotifications: null, startNotifications: null };
    }
  };
  const setupPowerNotifications = async (
    powerService: BluetoothRemoteGATTService,
    onPowerUpdate: (power: number) => void
  ) => {
    try {
      const powerChar = await powerService.getCharacteristic(
        CHARACTERISTICS.POWER
      );

      powerChar.addEventListener("characteristicvaluechanged", (e) => {
        const target = e.target as BluetoothRemoteGATTCharacteristic;
        const value = (
          target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
        ).value;
        if (!value) return;

        const dv = new DataView(value.buffer);
        const flags = dv.getUint16(0, true);
        const bytes = new Uint8Array(value.buffer);
        const hexDump = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");

        console.log(
          "Cycling Power raw:",
          hexDump,
          "flags:",
          "0x" + flags.toString(16).padStart(4, "0"),
          "len:",
          bytes.length
        );

        const newPower = dv.getInt16(2, true);
        console.log(
          "Power from Cycling Power Service at offset 2:",
          newPower,
          "W"
        );

        onPowerUpdate(newPower);
      });

      const charWithNotifications =
        powerChar as BluetoothRemoteGATTCharacteristic & {
          startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
          stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
        };

      return {
        stopNotifications: () => {
          charWithNotifications.stopNotifications().catch(console.error);
        },
        startNotifications: () => {
          charWithNotifications.startNotifications().catch(console.error);
        },
      };
    } catch {
      return { stopNotifications: null, startNotifications: null };
    }
  };
  const connectToDevice = useCallback(
    async (
      deviceInfo: DeviceInfo
    ): Promise<{
      startNotifications: () => void;
      stopNotifications: () => void;
    }> => {
      setError(null);
      const notificationFunctions = {
        startNotifications: null as (() => void) | null,
        stopNotifications: null as (() => void) | null,
      };

      try {
        const server = await deviceInfo.device.gatt?.connect();
        if (!server) {
          throw new Error("Failed to connect to GATT server");
        }

        setConnectedDevice(deviceInfo);

        try {
          const FTMService = await server.getPrimaryService(
            BLUETOOTH_SERVICES.FTM
          );
          const powerService = await server.getPrimaryService(
            BLUETOOTH_SERVICES.POWER
          );
          // const cadenceService = await server.getPrimaryService(
          //   BLUETOOTH_SERVICES.CADENCE
          // );
          // const heartRateService = await server.getPrimaryService(
          //   BLUETOOTH_SERVICES.HEART_RATE
          // );
          // const deviceInfoService = await server.getPrimaryService(
          //   BLUETOOTH_SERVICES.DEVICE_INFO
          // );

          const info: string[] = [];

          // Setup power notifications
          const powerNotificationFunctions = await setupPowerNotifications(
            powerService,
            (newPower) => {
              setHistoricalPowerData((prev) => [...prev, newPower]);
              setPower(newPower);
            }
          );

          // const cadenceNotificationFunctions = await setupCadenceNotifications(
          //   cadenceService,
          //   (newCadence) => {
          //     setHistoricalCadenceData((prev) => [...prev, newCadence]);
          //     setCadence(newCadence);
          //   }
          // );
          // const heartRateNotificationFunctions =
          //   await setupHeartRateNotifications(
          //     heartRateService,
          //     (newHeartRate) => {
          //       setHistoricalHeartRateData((prev) => [...prev, newHeartRate]);
          //       setHeartRate(newHeartRate);
          //     }
          //   );

          // Combine all notification functions into single start/stop functions
          const allStartFunctions: (() => void)[] = [];
          const allStopFunctions: (() => void)[] = [];

          if (powerNotificationFunctions.startNotifications) {
            allStartFunctions.push(
              powerNotificationFunctions.startNotifications
            );
          }
          if (powerNotificationFunctions.stopNotifications) {
            allStopFunctions.push(powerNotificationFunctions.stopNotifications);
          }
          // if (cadenceNotificationFunctions.startNotifications) {
          //   allStartFunctions.push(
          //     cadenceNotificationFunctions.startNotifications
          //   );
          // }
          // if (cadenceNotificationFunctions.stopNotifications) {
          //   allStopFunctions.push(
          //     cadenceNotificationFunctions.stopNotifications
          //   );
          // }
          // if (heartRateNotificationFunctions.startNotifications) {
          //   allStartFunctions.push(
          //     heartRateNotificationFunctions.startNotifications
          //   );
          // }
          // if (heartRateNotificationFunctions.stopNotifications) {
          //   allStopFunctions.push(
          //     heartRateNotificationFunctions.stopNotifications
          //   );
          // }

          // Create combined functions
          const combinedStartNotifications = () => {
            allStartFunctions.forEach((fn) => {
              try {
                fn();
              } catch (error) {
                console.error("Error starting notifications:", error);
              }
            });
          };

          const combinedStopNotifications = () => {
            allStopFunctions.forEach((fn) => {
              try {
                fn();
              } catch (error) {
                console.error("Error stopping notifications:", error);
              }
            });
          };

          // Store combined notification functions in state
          if (allStartFunctions.length > 0) {
            setStartNotifications(() => combinedStartNotifications);
          }
          if (allStopFunctions.length > 0) {
            setStopNotifications(() => combinedStopNotifications);
          }

          // Store individual functions for return value
          notificationFunctions.startNotifications = combinedStartNotifications;
          notificationFunctions.stopNotifications = combinedStopNotifications;

          if (info.length > 0) {
            setDeviceInfo(info.join(", "));
          }
        } catch (e) {
          console.error(e);
          setDeviceInfo("Device information not available");
        }

        // Listen for disconnection
        deviceInfo.device.addEventListener("gattserverdisconnected", () => {
          setConnectedDevice(null);
          setDeviceInfo(null);
          setStartNotifications(null);
          setStopNotifications(null);
          setError("Device disconnected");
        });

        return {
          startNotifications:
            notificationFunctions.startNotifications || (() => {}),
          stopNotifications:
            notificationFunctions.stopNotifications || (() => {}),
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(`Connection failed: ${err.message}`);
        } else {
          setError("Failed to connect to device");
        }
        return {
          startNotifications: () => {},
          stopNotifications: () => {},
        };
      }
    },
    []
  );

  const disconnectDevice = useCallback(() => {
    if (connectedDevice?.device.gatt?.connected) {
      connectedDevice.device.gatt.disconnect();
    }
    setConnectedDevice(null);
    setDeviceInfo(null);
    setStartNotifications(null);
    setStopNotifications(null);
    setError(null);
  }, [connectedDevice]);

  return {
    isSupported,
    isScanning,
    devices,
    connectedDevice,
    error,
    deviceInfo,
    power,
    cadence,
    heartRate,
    historicalPowerData,
    historicalCadenceData,
    historicalHeartRateData,
    startTimestamp,
    startNotifications,
    stopNotifications,
    checkSupport,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
  };
}
