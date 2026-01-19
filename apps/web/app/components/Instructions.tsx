export function Instructions() {
  return (
    <div
      style={{
        marginTop: "2rem",
        padding: "1rem",
        borderRadius: "8px",
        backgroundColor: "var(--gray-alpha-100)",
        fontSize: "0.875rem",
        lineHeight: "1.5",
      }}
    >
      <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>How to use:</p>
      <ol style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>
          Click &quot;Scan for Bluetooth Devices&quot; to search for nearby
          devices
        </li>
        <li>Select a device from the browser&apos;s device picker</li>
        <li>Click on the device in the list to connect</li>
        <li>Once connected, device information will be displayed</li>
        <li>Click &quot;Disconnect Device&quot; to disconnect</li>
      </ol>
      <p
        style={{
          margin: "0.5rem 0 0 0",
          fontSize: "0.75rem",
          opacity: 0.7,
        }}
      >
        Note: Web Bluetooth requires HTTPS (or localhost) and is supported in
        Chrome, Edge, and Opera browsers.
      </p>
    </div>
  );
}
