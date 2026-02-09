import { useState, useCallback, Dispatch, SetStateAction } from "react";
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
    null,
  );
  const [cadenceSource, setCadenceSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);
  const [power, setPower] = useState<number | null>(0);
  const [cadence, setCadence] = useState<number | null>(0);
  const [heartRate, setHeartRate] = useState<number | null>(0);
  const [historicalPowerData, setHistoricalPowerData] = useState<number[]>([]);
  const [historicalCadenceData, setHistoricalCadenceData] = useState<number[]>(
    [],
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
  const [writeValueFunction, setWriteValueFunction] = useState<
    ((value: Uint8Array<ArrayBuffer>) => void) | null
  >(null);
  const checkSupport = useCallback(() => {
    if (typeof window !== "undefined" && navigator.bluetooth) {
      setIsSupported(true);
      setError(null);
    } else {
      setIsSupported(false);
      setError(
        "Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Opera.",
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
    characteristicId: number,
  ): Promise<BluetoothRemoteGATTCharacteristic | null> => {
    try {
      return await service.getCharacteristic(characteristicId);
    } catch {
      return null;
    }
  };

  const readCharacteristic = async (
    service: BluetoothRemoteGATTService,
    characteristicId: number,
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

  const setupCadenceNotifications = useCallback(
    async (
      cadenceService: BluetoothRemoteGATTService,
      {
        setCadence,
        setHistoricalCadenceData,
      }: {
        setCadence: Dispatch<SetStateAction<number | null>>;
        setHistoricalCadenceData: Dispatch<SetStateAction<number[]>>;
      },
    ) => {
      try {
        const cadenceChar = await cadenceService.getCharacteristic(
          CHARACTERISTICS.CSC,
        );

        let lastCSCCrankRevs = 0;
        let lastCSCCrankTime = 0;
        let lastValidCadence = 0;
        let lastValidCadenceTime = 0;

        cadenceChar.addEventListener("characteristicvaluechanged", (e) => {
          const target = e.target as BluetoothRemoteGATTCharacteristic;
          const value = (
            target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
          ).value;
          if (!value) return;
          const dv = new DataView(value.buffer);
          const flags = dv.getUint8(0);

          // const bytes = new Uint8Array(e.target.value.buffer);
          // const hexDump = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
          // console.log('CSC Measurement:', hexDump, 'flags:', '0x' + flags.toString(16).padStart(2, '0'));

          let offset = 1;
          if (flags & 0x01) {
            offset += 6; // Skip wheel data (4 bytes revs + 2 bytes time)
          }

          // Crank Revolution Data Present (bit 1)
          if (flags & 0x02) {
            const cumulativeCrankRevs = dv.getUint16(offset, true);
            const lastCrankEventTime = dv.getUint16(offset + 2, true); // in 1/1024 seconds

            console.log(
              "CSC Crank revs:",
              cumulativeCrankRevs,
              "time:",
              lastCrankEventTime,
            );

            // Calculate cadence from deltas
            if (
              lastCSCCrankRevs !== undefined &&
              lastCSCCrankTime !== undefined
            ) {
              const revDelta =
                (cumulativeCrankRevs - lastCSCCrankRevs) & 0xffff;
              const timeDelta =
                ((lastCrankEventTime - lastCSCCrankTime) & 0xffff) / 1024.0;

              console.log(
                "CSC Delta revs:",
                revDelta,
                "delta time:",
                timeDelta.toFixed(3),
                "s",
              );

              if (timeDelta > 0 && revDelta > 0 && revDelta < 20) {
                const cadence = Math.round((revDelta / timeDelta) * 60); // RPM
                // Only update if we're the primary cadence source (first one wins)
                if (!cadenceSource || cadenceSource === "csc") {
                  setCadenceSource("csc");
                  setCadence(cadence);
                  setHistoricalCadenceData((prev: number[]) => [
                    ...prev,
                    cadence,
                  ]);
                }
                console.log("Cadence from CSC:", cadence, "RPM");

                // Store last valid cadence and timestamp for timeout detection
                lastValidCadence = cadence;
                lastValidCadenceTime = Date.now();
              } else if (timeDelta === 0 && revDelta === 0) {
                // Duplicate packet - keep current cadence but check for timeout
                if (
                  lastValidCadenceTime &&
                  Date.now() - lastValidCadenceTime > 2000
                ) {
                  // No new data for 2 seconds, user stopped pedaling
                  setCadence(0);
                  setHistoricalCadenceData((prev: number[]) => [...prev, 0]);
                }
                // Otherwise keep the last valid cadence
              }
            }

            lastCSCCrankRevs = cumulativeCrankRevs;
            lastCSCCrankTime = lastCrankEventTime;
          }
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
          writeValue: null,
        };
      } catch (e) {
        console.error(e);
        return { stopNotifications: null, startNotifications: null };
      }
    },
    [cadenceSource],
  );

  const setupHeartRateNotifications = useCallback(
    async (
      heartRateService: BluetoothRemoteGATTService,
      {
        setHeartRate,
        setHistoricalHeartRateData,
      }: {
        setHeartRate: Dispatch<SetStateAction<number | null>>;
        setHistoricalHeartRateData: Dispatch<SetStateAction<number[]>>;
      },
    ) => {
      try {
        const heartRateChar = await heartRateService.getCharacteristic(
          CHARACTERISTICS.HRM,
        );
        heartRateChar.addEventListener("characteristicvaluechanged", (e) => {
          const target = e.target as BluetoothRemoteGATTCharacteristic;
          const value = (
            target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
          ).value;
          if (!value) return;
          const dv = new DataView(value.buffer);
          const flags = dv.getUint8(0);
          const heartRate =
            flags & 0x01 ? dv.getUint16(1, true) : dv.getUint8(1); // Heart rate is typically at offset 1
          setHeartRate(heartRate);
          setHistoricalHeartRateData((prev: number[]) => [...prev, heartRate]);
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
          writeValue: null,
        };
      } catch (e) {
        console.error(e);
        return { stopNotifications: null, startNotifications: null };
      }
    },
    [],
  );
  const setupPowerNotifications = useCallback(
    async (
      powerService: BluetoothRemoteGATTService,
      {
        setPower,
        setHistoricalPowerData,
        setCadenceSource,
        setCadence,
        setHistoricalCadenceData,
      }: {
        setPower: Dispatch<SetStateAction<number | null>>;
        setHistoricalPowerData: Dispatch<SetStateAction<number[]>>;
        setCadenceSource: Dispatch<SetStateAction<string | null>>;
        setCadence: Dispatch<SetStateAction<number | null>>;
        setHistoricalCadenceData: Dispatch<SetStateAction<number[]>>;
      },
    ) => {
      try {
        const powerChar = await powerService.getCharacteristic(
          CHARACTERISTICS.POWER,
        );

        let lastCrankRevs = 0;
        let lastCrankTime = 0;
        let lastValidCadence = 0;
        let lastValidCadenceTime = 0;

        powerChar.addEventListener("characteristicvaluechanged", (e) => {
          const target = e.target as BluetoothRemoteGATTCharacteristic;
          const value = (
            target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
          ).value;
          if (!value) return;

          const dv = new DataView(value.buffer);
          const flags = dv.getUint16(0, true);
          // const bytes = new Uint8Array(value.buffer);
          // const hexDump = Array.from(bytes)
          //   .map((b) => b.toString(16).padStart(2, "0"))
          //   .join(" ");

          // console.log(
          //   "Cycling Power raw:",
          //   hexDump,
          //   "flags:",
          //   "0x" + flags.toString(16).padStart(4, "0"),
          //   "len:",
          //   bytes.length
          // );
          const power = dv.getInt16(2, true);
          // console.log('Power from Cycling Power Service at offset 2:', power, 'W');

          // Only use Cycling Power if valid (non-zero), otherwise keep Indoor Bike Data power
          if (power > 0) {
            setPower(power);
            setHistoricalPowerData((prev: number[]) => [...prev, power]);
          }

          // Calculate offset for optional fields (same approach as debug.html)
          let offset = 4; // Start after flags (2) + power (2)

          // Skip Pedal Power Balance (bit 0 = 0x01)
          if (flags & 0x01) {
            offset += 1;
          }

          // Skip Accumulated Torque (bit 2 = 0x04)
          if (flags & 0x04) {
            offset += 2;
          }

          // Skip Wheel Revolution Data (bit 4 = 0x10)
          if (flags & 0x10) {
            offset += 6; // 4 bytes wheel revs + 2 bytes wheel time
          }

          // Crank Revolution Data (bit 5 = 0x20)
          if (flags & 0x20) {
            // Standard spec: 16-bit crank revs + 16-bit time
            const cumulativeCrankRevs = dv.getUint16(offset, true);
            const lastCrankEventTime = dv.getUint16(offset + 2, true); // in 1/1024 seconds

            // Calculate cadence from deltas (if we have previous values)
            if (lastCrankRevs !== undefined && lastCrankTime !== undefined) {
              // Handle 16-bit wrap-around
              const revDelta = (cumulativeCrankRevs - lastCrankRevs) & 0xffff;
              const timeDelta =
                ((lastCrankEventTime - lastCrankTime) & 0xffff) / 1024.0; // seconds

              // console.log('CP Crank data - revs:', cumulativeCrankRevs, 'time:', lastCrankEventTime,
              //             'delta revs:', revDelta, 'delta time:', timeDelta.toFixed(3), 's');

              if (timeDelta > 0 && revDelta > 0 && revDelta < 20) {
                const cadence = Math.round((revDelta / timeDelta) * 60); // RPM
                // Only use power service cadence if CSC isn't providing it (CSC is preferred)
                if (cadenceSource !== "csc") {
                  setCadenceSource("power");
                  setCadence(cadence);
                  setHistoricalCadenceData((prev: number[]) => [
                    ...prev,
                    cadence,
                  ]);
                }
                // console.log('Cadence from Cycling Power:', cadence, 'RPM');

                lastValidCadence = cadence;
                lastValidCadenceTime = Date.now();
              } else if (timeDelta === 0 && revDelta === 0) {
                // Duplicate - keep cadence but check timeout
                if (
                  lastValidCadenceTime &&
                  Date.now() - lastValidCadenceTime > 2000
                ) {
                  setCadence(0);
                  setHistoricalCadenceData((prev: number[]) => [...prev, 0]);
                }
              }
            }

            lastCrankRevs = cumulativeCrankRevs;
            lastCrankTime = lastCrankEventTime;

            offset += 4; // Skip past crank data (2 bytes revs + 2 bytes time)
          }
          // Note: If no crank data in Cycling Power, Indoor Bike Data will provide cadence
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
          writeValue: null,
        };
      } catch {
        return { stopNotifications: null, startNotifications: null };
      }
    },
    [cadenceSource],
  );
  const setupFTMNotifications = useCallback(
    async (
      FTMService: BluetoothRemoteGATTService,
      {
        setCadence,
        setPower,
        setHeartRate,
        setHistoricalCadenceData,
        setHistoricalPowerData,
        setHistoricalHeartRateData,
        setCadenceSource,
      }: {
        setCadence: Dispatch<SetStateAction<number | null>>;
        setPower: Dispatch<SetStateAction<number | null>>;
        setHeartRate: Dispatch<SetStateAction<number | null>>;
        setHistoricalCadenceData: Dispatch<SetStateAction<number[]>>;
        setHistoricalPowerData: Dispatch<SetStateAction<number[]>>;
        setHistoricalHeartRateData: Dispatch<SetStateAction<number[]>>;
        setCadenceSource: Dispatch<SetStateAction<string | null>>;
      },
    ) => {
      try {
        const indoorBikeChar = await FTMService.getCharacteristic(
          CHARACTERISTICS.INDOOR_BIKE,
        );
        indoorBikeChar.addEventListener("characteristicvaluechanged", (e) => {
          const target = e.target as BluetoothRemoteGATTCharacteristic;
          const value = (
            target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
          ).value;
          if (!value) return;
          const dv = new DataView(value.buffer);
          const flags = dv.getUint16(0, true);
          let offset = 2;

          if (!(flags & 0x01)) {
            offset += 2; // Skip speed
          }

          // Average Speed Present (bit 1)
          if (flags & 0x02) {
            offset += 2; // Skip average speed
          }

          // Instantaneous Cadence Present (bit 2)
          if (flags & 0x04 && !cadenceSource) {
            const cadence = dv.getUint16(offset, true);
            setCadence(cadence);
            setHistoricalCadenceData((prev: number[]) => [...prev, cadence]);
            setCadenceSource("ftm");
            offset += 2;
          }

          // Average Cadence Present (bit 3)
          if (flags & 0x08) {
            offset += 2;
          }

          // Total Distance Present (bit 4)
          if (flags & 0x10) {
            offset += 3; // 24-bit field
          }

          // Resistance Level Present (bit 5)
          if (flags & 0x20) {
            offset += 2; // Skip resistance
          }

          // Instantaneous Power Present (bit 6)
          if (flags & 0x40) {
            const power = dv.getInt16(offset, true);
            // Use Indoor Bike Data power as primary source
            setPower(power);
            setHistoricalPowerData((prev: number[]) => [...prev, power]);
            offset += 2;
          }

          // Average Power Present (bit 7)
          if (flags & 0x80) {
            offset += 2;
          }

          // Extended Energy fields (bits 8-11)
          if (flags & 0x100) {
            // Total Energy
            offset += 2;
          }
          if (flags & 0x200) {
            // Energy Per Hour
            offset += 2;
          }
          if (flags & 0x400) {
            // Energy Per Minute
            offset += 1;
          }
          if (flags & 0x800) {
            // Heart Rate
            const hr = dv.getUint8(offset);
            setHeartRate(hr);
            setHistoricalHeartRateData((prev: number[]) => [...prev, hr]);
            offset += 1;
          }
        });
        return {
          stopNotifications: () => {
            indoorBikeChar.stopNotifications().catch(console.error);
          },
          startNotifications: () => {
            indoorBikeChar.startNotifications().catch(console.error);
          },
          writeValue: null,
        };
      } catch (error) {
        console.error("Error setting up FTM notifications:", error);
      }
    },
    [cadenceSource],
  );

  const setupControlPointNotifications = useCallback(
    async (ftmsService: BluetoothRemoteGATTService) => {
      try {
        const controlPointChar = await ftmsService.getCharacteristic(
          CHARACTERISTICS.CONTROL_POINT,
        );

        // Subscribe to control point responses
        controlPointChar.addEventListener("characteristicvaluechanged", (e) => {
          const target = e.target as BluetoothRemoteGATTCharacteristic;
          const value = (
            target as BluetoothRemoteGATTCharacteristic & { value?: DataView }
          ).value;
          if (!value) return;
          const data = new Uint8Array(value.buffer);
          const responseStr = Array.from(data)
            .map((b) => "0x" + b.toString(16).padStart(2, "0"))
            .join(" ");
          console.log("response", responseStr);
          // Decode response
          if (data[0] === 0x80) {
            const opcode = data[1];
            const result = data[2];
            const resultCodes = [
              "",
              "Success",
              "Not Supported",
              "Invalid Param",
              "Failed",
              "Control Not Permitted",
            ];
            console.log(
              `FTMS Response: ${responseStr} (${resultCodes[result ?? 0] || "Unknown"})`,
              `opcode: ${opcode}`,
              result === 0x01 ? "success" : "error",
            );
          } else {
            console.log(`FTMS Response: ${responseStr}`, "info");
          }
        });

        // Send Request Control command (0x00) - no parameters needed
        const requestControl = new Uint8Array([0x00]);
        await controlPointChar.writeValue(requestControl);
        console.log("Sent Request Control (0x00)", "info");

        return {
          stopNotifications: () => {
            controlPointChar.stopNotifications().catch(console.error);
          },
          startNotifications: () => {
            controlPointChar.startNotifications().catch(console.error);
          },
          writeValue: (value: Uint8Array<ArrayBuffer>) => {
            controlPointChar.writeValue(value).catch(console.error);
          },
        };
      } catch (error) {
        console.log("Error setting up control point notifications:", error);
        return {
          stopNotifications: null,
          startNotifications: null,
          writeValue: null,
        };
      }
    },
    [],
  );
  const connectToDevice = useCallback(
    async (
      deviceInfo: DeviceInfo,
    ): Promise<{
      startNotifications: () => void;
      stopNotifications: () => void;
      writeValue: (value: Uint8Array) => void;
    }> => {
      setError(null);
      const notificationFunctions = {
        startNotifications: null as (() => void) | null,
        stopNotifications: null as (() => void) | null,
        writeValue: null as ((value: Uint8Array) => void) | null,
      };

      try {
        const server = await deviceInfo.device.gatt?.connect();
        if (!server) {
          throw new Error("Failed to connect to GATT server");
        }
        console.log("server", server);

        setConnectedDevice(deviceInfo);
        const allStartFunctions: (() => void)[] = [];
        const allStopFunctions: (() => void)[] = [];
        const allWriteValueFunctions: ((
          value: Uint8Array<ArrayBuffer>,
        ) => void)[] = [];

        // Define service configurations
        const serviceConfigs = [
          {
            service: BLUETOOTH_SERVICES.FTM,
            setupFunction: setupFTMNotifications,
            params: {
              setCadence,
              setPower,
              setHeartRate,
              setHistoricalCadenceData,
              setHistoricalPowerData,
              setHistoricalHeartRateData,
              setCadenceSource,
            },
            errorMessage: "Error getting FTM service:",
          },
          {
            service: BLUETOOTH_SERVICES.POWER,
            setupFunction: setupPowerNotifications,
            params: {
              setPower,
              setHistoricalPowerData,
              setCadenceSource,
              setCadence,
              setHistoricalCadenceData,
            },
            errorMessage: "Error getting power service:",
          },
          {
            service: BLUETOOTH_SERVICES.CADENCE,
            setupFunction: setupCadenceNotifications,
            params: { setCadence, setHistoricalCadenceData, setCadenceSource },
            errorMessage: "Error getting power service:",
          },
          {
            service: BLUETOOTH_SERVICES.HEART_RATE,
            setupFunction: setupHeartRateNotifications,
            params: { setHeartRate, setHistoricalHeartRateData },
            errorMessage: "Error getting heart rate service:",
          },
          {
            service: BLUETOOTH_SERVICES.FTM,
            setupFunction: setupControlPointNotifications,
            params: {},
            errorMessage: "Error getting control point service:",
          },
        ];

        // Process each service configuration
        for (const config of serviceConfigs) {
          try {
            const service = await server.getPrimaryService(config.service);
            const notificationFunctions = await config.setupFunction(
              service,
              config.params as any,
            );
            console.log("setup", config.service);
            if (
              notificationFunctions &&
              notificationFunctions.startNotifications
            ) {
              allStartFunctions.push(notificationFunctions.startNotifications);
            }
            if (
              notificationFunctions &&
              notificationFunctions.stopNotifications
            ) {
              allStopFunctions.push(notificationFunctions.stopNotifications);
            }
            if (notificationFunctions && notificationFunctions.writeValue) {
              console.log("writeValue", notificationFunctions.writeValue);
              allWriteValueFunctions.push(notificationFunctions.writeValue);
            }
          } catch (error) {
            console.log(config.errorMessage, error);
          }
        }

        // Create combined functions
        const combinedStartNotifications = () => {
          allStartFunctions.forEach((fn) => {
            try {
              fn();
            } catch (error) {
              console.log("Error starting notifications:", error);
            }
          });
        };

        const combinedStopNotifications = () => {
          allStopFunctions.forEach((fn) => {
            try {
              fn();
            } catch (error) {
              console.log("Error stopping notifications:", error);
            }
          });
        };

        const combinedWriteValue = (value: Uint8Array<ArrayBuffer>) => {
          allWriteValueFunctions.forEach((fn) => {
            try {
              fn(value);
            } catch (error) {
              console.log("Error writing value:", error);
            }
          });
        };
        console.log("allStartFunctions", allStartFunctions);
        console.log("allStopFunctions", allStopFunctions);
        console.log("allWriteValueFunctions", allWriteValueFunctions);
        // Store combined notification functions in state
        if (allStartFunctions.length > 0) {
          setStartNotifications(() => combinedStartNotifications);
        }
        if (allStopFunctions.length > 0) {
          setStopNotifications(() => combinedStopNotifications);
        }
        if (allWriteValueFunctions.length > 0) {
          setWriteValueFunction(() => combinedWriteValue);
        }

        // Store individual functions for return value
        notificationFunctions.startNotifications = combinedStartNotifications;
        notificationFunctions.stopNotifications = combinedStopNotifications;
        notificationFunctions.writeValue = combinedWriteValue as (
          value: Uint8Array<ArrayBufferLike>,
        ) => void;
        // if (info.length > 0) {
        //   setDeviceInfo(info.join(", "));
        // }
      } catch (e) {
        console.log(e);
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
        writeValue: notificationFunctions.writeValue || (() => {}),
      };
    },
    [
      setupCadenceNotifications,
      setupPowerNotifications,
      setupHeartRateNotifications,
      setupFTMNotifications,
      setupControlPointNotifications,
    ],
  );

  const setTrainerTargetPower = useCallback(
    async (power: number) => {
      console.log("setTrainerTargetPower", power);
      if (writeValueFunction) {
        console.log("writeValueFunction", writeValueFunction);
        try {
          const data = new Uint8Array(3);
          data[0] = 0x05;
          data[1] = power & 0xff;
          data[2] = (power >> 8) & 0xff;
          await writeValueFunction(data);
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.log("error setting target power", error);
        }
      }
    },
    [writeValueFunction],
  );

  const disconnectDevice = useCallback(() => {
    if (connectedDevice?.device.gatt?.connected) {
      connectedDevice.device.gatt.disconnect();
    }
    setConnectedDevice(null);
    setDeviceInfo(null);
    setStartNotifications(null);
    setStopNotifications(null);
    setWriteValueFunction(null);
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
    cadenceSource,
    startTimestamp,
    startNotifications,
    stopNotifications,
    setTrainerTargetPower,
    checkSupport,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
  };
}
