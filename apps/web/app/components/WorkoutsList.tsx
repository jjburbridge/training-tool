"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";

export interface WorkoutItem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  workoutType: string;
  difficulty: string;
}

const PAGE_SIZE = 10;

function formatWorkoutType(type: string): string {
  const labels: Record<string, string> = {
    endurance: "Endurance",
    tempo: "Tempo",
    threshold: "Threshold",
    vo2max: "VO2 Max",
    sprint: "Sprint",
    recovery: "Recovery",
    sweetspot: "Sweet Spot",
    overunder: "Over/Under",
  };
  return labels[type] ?? type;
}

function formatDifficulty(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    professional: "Professional",
  };
  return labels[difficulty] ?? difficulty;
}

interface WorkoutsListProps {
  initialWorkouts: WorkoutItem[];
  initialTotal: number;
}

export function WorkoutsList({
  initialWorkouts,
  initialTotal,
}: WorkoutsListProps) {
  const [workouts, setWorkouts] = useState<WorkoutItem[]>(initialWorkouts);
  const [offset, setOffset] = useState(initialWorkouts.length);
  const [hasMore, setHasMore] = useState(
    initialWorkouts.length < initialTotal
  );
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/workouts?offset=${offset}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setWorkouts((prev) => [...prev, ...data.workouts]);
      setOffset((prev) => prev + data.workouts.length);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error loading more workouts:", err);
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
      {workouts.length === 0 ? (
        <p
          style={{
            color: "var(--sanity-foreground-muted)",
            fontSize: "1rem",
          }}
        >
          No workouts found.
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
          {workouts.map((workout) => (
            <li key={workout._id}>
              <Link
                href={`/workout/${workout.slug}`}
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
                  {workout.title}
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--sanity-foreground-muted)",
                  }}
                >
                  <span>{formatWorkoutType(workout.workoutType)}</span>
                  <span>•</span>
                  <span>{formatDifficulty(workout.difficulty)}</span>
                </div>
                {workout.description && (
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.875rem",
                      color: "var(--sanity-foreground-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    {workout.description}
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

      {!hasMore && workouts.length > 0 && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--sanity-foreground-muted)",
            padding: "0.5rem",
          }}
        >
          You&apos;ve seen all {workouts.length} workouts
        </p>
      )}
    </div>
  );
}
