"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { useBluetooth } from "./hooks/useBluetooth";
import {
  ErrorMessage,
  ActionButtons,
  ConnectedDeviceCard,
  DeviceList,
} from "./components";

export default function Home() {
  const {
    isSupported,
    isScanning,
    devices,
    connectedDevice,
    error,
    deviceInfo,
    power,
    startNotifications,
    stopNotifications,
    checkSupport,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
  } = useBluetooth();

  return (
    <div className={styles.homePage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLabel}>Cycling Training</div>
        <h1 className={styles.heroTitle}>
          Train smarter with structured workouts and power meter integration
        </h1>
        <p className={styles.heroSubtitle}>
          Browse curated workouts, follow training plans, and connect your power
          meter for real-time feedback. The AI assistant helps you find the
          right workout for your goals.
        </p>
        <div className={styles.ctas}>
          <Link href="/workouts" className={styles.ctaPrimary}>
            Browse Workouts →
          </Link>
          <Link href="/workout-plans" className={styles.ctaSecondary}>
            View Plans
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Explore</div>
        <div className={styles.cardGrid}>
          <Link href="/workouts" className={styles.card}>
            <div className={styles.cardIcon}>📋</div>
            <div className={styles.cardTitle}>Workouts</div>
            <div className={styles.cardDesc}>
              Endurance, tempo, threshold, VO2 max, and more. Each workout
              includes power zones and segment structure.
            </div>
          </Link>
          <Link href="/workout-plans" className={styles.card}>
            <div className={styles.cardIcon}>📅</div>
            <div className={styles.cardTitle}>Workout Plans</div>
            <div className={styles.cardDesc}>
              Multi-week training plans tailored to your level. Base building,
              build phase, and peak plans.
            </div>
          </Link>
          <a href="#power-meter" className={styles.card}>
            <div className={styles.cardIcon}>⚡</div>
            <div className={styles.cardTitle}>Power Meter</div>
            <div className={styles.cardDesc}>
              Connect your Bluetooth power meter for live wattage display during
              workouts.
            </div>
          </a>
        </div>
      </section>

      {/* Power Meter section */}
      <section
        id="power-meter"
        className={styles.powerMeterSection}
      >
        <div className={styles.powerMeterHeader}>
          <div>
            <div className={styles.powerMeterLabel}>Power Meter</div>
            <h2 className={styles.powerMeterTitle}>
              Bluetooth Device Connection
            </h2>
          </div>
        </div>

        {isSupported === null && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <button
              onClick={checkSupport}
              className={styles.ctaPrimary}
              style={{ margin: "0 auto" }}
            >
              Check Web Bluetooth Support
            </button>
          </div>
        )}

        {isSupported === false && error && (
          <ErrorMessage message={error} />
        )}

        {isSupported === true && (
          <>
            <ActionButtons
              isScanning={isScanning}
              onScan={scanForDevices}
              connectedDevice={connectedDevice}
              onDisconnect={disconnectDevice}
            />

            {error && <ErrorMessage message={error} />}

            {connectedDevice && (
              <ConnectedDeviceCard
                device={connectedDevice}
                deviceInfo={deviceInfo}
                power={power}
                startNotifications={startNotifications}
                stopNotifications={stopNotifications}
              />
            )}

            {devices.length > 0 && !connectedDevice && (
              <DeviceList devices={devices} onConnect={connectToDevice} />
            )}

            <div className={styles.instructions}>
              <div className={styles.instructionsTitle}>How to connect</div>
              <ol>
                <li>Click &quot;Scan for Bluetooth Devices&quot; to search</li>
                <li>Select a device from the browser&apos;s device picker</li>
                <li>Click a device in the list to connect</li>
                <li>Once connected, power data will display</li>
              </ol>
              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.75rem",
                  opacity: 0.8,
                }}
              >
                Web Bluetooth requires HTTPS (or localhost). Supported in Chrome,
                Edge, and Opera.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
