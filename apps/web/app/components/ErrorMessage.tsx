interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "8px",
        backgroundColor: "rgba(255, 0, 0, 0.1)",
        border: "1px solid rgba(255, 0, 0, 0.3)",
        marginBottom: "1rem",
      }}
    >
      <p style={{ color: "var(--foreground)", margin: 0 }}>{message}</p>
    </div>
  );
}
