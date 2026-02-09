"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";

export interface WorkoutPlanItem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  planType?: string;
  duration?: { value?: number; unit?: string };
  targetLevel?: string;
  workoutCount: number;
}

const PAGE_SIZE = 10;

function formatPlanType(type: string): string {
  const labels: Record<string, string> = {
    base: "Base Building",
    build: "Build Phase",
    peak: "Peak",
    recovery: "Recovery",
    maintenance: "Maintenance",
    event: "Event-Specific",
  };
  return labels[type] ?? type;
}

function formatDuration(duration?: { value?: number; unit?: string }): string {
  if (!duration?.value || !duration?.unit) return "";
  const unit = duration.unit === "months" ? "mo" : "wk";
  return `${duration.value} ${unit}`;
}

function formatLevel(level?: string): string {
  const labels: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    professional: "Professional",
  };
  return level ? (labels[level] ?? level) : "";
}

interface WorkoutPlansListProps {
  initialPlans: WorkoutPlanItem[];
  initialTotal: number;
}

export function WorkoutPlansList({
  initialPlans,
  initialTotal,
}: WorkoutPlansListProps) {
  const [plans, setPlans] = useState<WorkoutPlanItem[]>(initialPlans);
  const [offset, setOffset] = useState(initialPlans.length);
  const [hasMore, setHasMore] = useState(initialPlans.length < initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/workout-plans?offset=${offset}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setPlans((prev) => [...prev, ...data.workoutPlans]);
      setOffset((prev) => prev + data.workoutPlans.length);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error loading more workout plans:", err);
    } finally {
      setIsLoading(false);
    }
  }, [offset, hasMore, isLoading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "100px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1.5rem",
      }}
    >
      {plans.length === 0 ? (
        <p
          style={{
            color: "var(--sanity-foreground-muted)",
            fontSize: "1rem",
          }}
        >
          No workout plans found.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {plans.map((plan) => (
            <li key={plan._id}>
              <Link
                href={`/workout-plans/${plan.slug}`}
                style={{
                  display: "block",
                  padding: "1rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid var(--sanity-border)",
                  backgroundColor: "var(--sanity-bg-elevated)",
                  color: "var(--sanity-foreground)",
                  textDecoration: "none",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--sanity-border-strong)";
                  e.currentTarget.style.backgroundColor =
                    "var(--sanity-bg-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--sanity-border)";
                  e.currentTarget.style.backgroundColor =
                    "var(--sanity-bg-elevated)";
                }}
              >
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                    color: "var(--sanity-foreground)",
                  }}
                >
                  {plan.title}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem 0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--sanity-foreground-muted)",
                  }}
                >
                  {plan.planType && (
                    <span>{formatPlanType(plan.planType)}</span>
                  )}
                  {plan.duration && formatDuration(plan.duration) && (
                    <>
                      {plan.planType && <span>•</span>}
                      <span>{formatDuration(plan.duration)}</span>
                    </>
                  )}
                  {plan.workoutCount > 0 && (
                    <>
                      {(plan.planType || plan.duration) && <span>•</span>}
                      <span>{plan.workoutCount} workouts</span>
                    </>
                  )}
                  {plan.targetLevel && (
                    <>
                      <span>•</span>
                      <span>{formatLevel(plan.targetLevel)}</span>
                    </>
                  )}
                </div>
                {plan.description && (
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.875rem",
                      color: "var(--sanity-foreground-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    {plan.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} style={{ height: 1, minHeight: 1 }} />

      {isLoading && (
        <div
          style={{
            textAlign: "center",
            padding: "1rem",
            fontSize: "0.875rem",
            color: "var(--sanity-foreground-muted)",
          }}
        >
          Loading more…
        </div>
      )}

      {!hasMore && plans.length > 0 && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--sanity-foreground-muted)",
            padding: "0.5rem",
          }}
        >
          You&apos;ve seen all {plans.length} workout plans
        </p>
      )}
    </div>
  );
}
