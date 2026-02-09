"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useState } from "react";
import { CLIENT_TOOLS } from "../lib/chatbot/clientTools";
import { getPageContext } from "../lib/chatbot/getPageContext";

function getTextFromNode(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextFromNode).join("");
  if (node && typeof node === "object" && "props" in node) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    return getTextFromNode(el.props.children);
  }
  return "";
}

/** Card for workout/workout-plan links in chat */
function WorkoutCard({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        marginTop: "0.5rem",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        border: "1px solid var(--sanity-border)",
        backgroundColor: "var(--sanity-bg-elevated)",
        color: "var(--sanity-foreground)",
        textDecoration: "none",
        transition: "border-color 0.2s, background 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--sanity-border-strong)";
        e.currentTarget.style.backgroundColor = "var(--sanity-bg-muted)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--sanity-border)";
        e.currentTarget.style.backgroundColor = "var(--sanity-bg-elevated)";
      }}
    >
      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{title}</span>
      <span
        style={{
          marginLeft: "0.35rem",
          fontSize: "0.8rem",
          color: "var(--sanity-foreground-muted)",
        }}
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}

const markdownStyles = {
  p: { margin: "0 0 0.5em", lineHeight: 1.5 },
  "p:last-child": { marginBottom: 0 },
  strong: { fontWeight: 600 },
  em: { fontStyle: "italic" },
  ul: { margin: "0.5em 0", paddingLeft: "1.25em" },
  ol: { margin: "0.5em 0", paddingLeft: "1.25em" },
  li: { marginBottom: "0.25em" },
  code: {
    padding: "0.15em 0.4em",
    borderRadius: "4px",
    backgroundColor: "var(--sanity-bg-muted)",
    fontSize: "0.85em",
    fontFamily: "var(--font-geist-mono), monospace",
  },
  pre: {
    margin: "0.5em 0",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    backgroundColor: "var(--sanity-bg-muted)",
    overflow: "auto",
    fontSize: "0.85em",
    lineHeight: 1.4,
  },
  h1: { fontSize: "1.1em", fontWeight: 600, margin: "0.75em 0 0.25em" },
  h2: { fontSize: "1.05em", fontWeight: 600, margin: "0.6em 0 0.2em" },
  h3: { fontSize: "1em", fontWeight: 600, margin: "0.5em 0 0.2em" },
  blockquote: {
    margin: "0.5em 0",
    paddingLeft: "1em",
    borderLeft: "3px solid var(--sanity-border-strong)",
    color: "var(--sanity-foreground-muted)",
  },
};

/** Renders markdown with styled components. Workout/workout-plan links become cards. */
function MarkdownMessage({ content }: { content: string }) {
  const isWorkoutLink = (href: string) =>
    /^\/(workout|workout-plans)\/[a-zA-Z0-9-_]+$/.test(href);

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p style={markdownStyles.p}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong style={markdownStyles.strong}>{children}</strong>
        ),
        em: ({ children }) => <em style={markdownStyles.em}>{children}</em>,
        ul: ({ children }) => <ul style={markdownStyles.ul}>{children}</ul>,
        ol: ({ children }) => <ol style={markdownStyles.ol}>{children}</ol>,
        li: ({ children }) => <li style={markdownStyles.li}>{children}</li>,
        code: ({ className, children }) => (
          <code
            style={
              className
                ? { padding: 0, backgroundColor: "transparent" }
                : markdownStyles.code
            }
          >
            {children}
          </code>
        ),
        pre: ({ children }) => <pre style={markdownStyles.pre}>{children}</pre>,
        h1: ({ children }) => <h1 style={markdownStyles.h1}>{children}</h1>,
        h2: ({ children }) => <h2 style={markdownStyles.h2}>{children}</h2>,
        h3: ({ children }) => <h3 style={markdownStyles.h3}>{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote style={markdownStyles.blockquote}>{children}</blockquote>
        ),
        a: ({ href, children }) => {
          if (href && isWorkoutLink(href)) {
            const title = getTextFromNode(children) || "View";
            return <WorkoutCard href={href} title={title} />;
          }
          const isExternal = href?.startsWith("http");
          return (
            <Link
              href={href ?? "#"}
              {...(isExternal && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
              style={{
                color: "inherit",
                textDecoration: "underline",
                fontWeight: 500,
              }}
            >
              {children}
            </Link>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, stop, addToolOutput } =
    useChat({
      sendAutomaticallyWhen: ({ messages }) =>
        lastAssistantMessageIsCompleteWithToolCalls({ messages }),
      onToolCall: async ({ toolCall }) => {
        if (toolCall.dynamic) return;
        if (toolCall.toolName === CLIENT_TOOLS.PAGE_CONTEXT) {
          const context = getPageContext();
          addToolOutput({
            tool: CLIENT_TOOLS.PAGE_CONTEXT,
            toolCallId: toolCall.toolCallId,
            output: context,
          });
        }
      },
    });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "var(--sanity-foreground)",
          color: "var(--sanity-bg)",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          zIndex: 1000,
        }}
        aria-label={isOpen ? "Close chat" : "Open workout assistant"}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "5rem",
            right: "1.5rem",
            width: "min(400px, calc(100vw - 3rem))",
            maxHeight: "min(500px, calc(100vh - 8rem))",
            backgroundColor: "var(--sanity-bg-elevated)",
            border: "1px solid var(--sanity-border)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--sanity-border)",
              backgroundColor: "var(--sanity-bg-muted)",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "var(--sanity-foreground)",
            }}
          >
            Workout Assistant
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              minHeight: "200px",
              maxHeight: "350px",
            }}
          >
            {messages.length === 0 && (
              <p
                style={{
                  color: "var(--sanity-foreground-muted)",
                  fontSize: "0.875rem",
                  margin: "auto",
                  textAlign: "center",
                }}
              >
                Ask about workouts, training plans, or get recommendations based
                on your goals.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  alignSelf:
                    message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  backgroundColor:
                    message.role === "user"
                      ? "var(--sanity-foreground)"
                      : "var(--sanity-bg-muted)",
                  color:
                    message.role === "user"
                      ? "var(--sanity-bg)"
                      : "var(--sanity-foreground)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    marginBottom: "0.25rem",
                    opacity: 0.8,
                  }}
                >
                  {message.role === "user" ? "You" : "Assistant"}
                </div>
                <div style={{ overflowWrap: "break-word" }}>
                  {message.parts?.map((part, i) =>
                    part.type === "text" ? (
                      <MarkdownMessage
                        key={i}
                        content={part.text}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "0.5rem",
                  color: "var(--sanity-foreground-muted)",
                  fontSize: "0.8rem",
                }}
              >
                Thinking…
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                fontSize: "0.8rem",
              }}
            >
              {error.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              padding: "1rem",
              borderTop: "1px solid var(--sanity-border)",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about workouts..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--sanity-border-strong)",
                backgroundColor: "var(--sanity-bg)",
                color: "var(--sanity-foreground)",
                fontSize: "0.9rem",
              }}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--sanity-bg-muted)",
                  color: "var(--sanity-foreground)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--sanity-foreground)",
                  color: "var(--sanity-bg)",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  opacity: input.trim() ? 1 : 0.5,
                  fontSize: "0.9rem",
                }}
              >
                Send
              </button>
            )}
          </form>
        </div>
      )}
    </>
  );
}
