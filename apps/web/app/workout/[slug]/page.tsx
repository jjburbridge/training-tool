import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "../../lib/sanity/client";
import {
  WORKOUT_QUERY,
  ALL_WORKOUTS_DEBUG_QUERY,
} from "../../lib/sanity/queries";
import { WorkoutGraphWrapper } from "../../components/WorkoutGraphWrapper";
import { WorkoutPowerDisplay } from "../../components/WorkoutPowerDisplay";

interface WorkoutPageProps {
  params: Promise<{ slug: string }>;
}

interface WorkoutSegment {
  segmentType: string;
  duration: {
    value: number;
    unit: string;
  };
  powerTarget?: {
    percentFTP?: number;
    initialPercentFTP?: number;
    finalPercentFTP?: number;
  };
  heartRateTarget?: {
    zone?: string;
    bpm?: number;
  };
  cadenceTarget?: {
    rpm?: number;
    range?: {
      min?: number;
      max?: number;
    };
  };
  repetitions?: number;
  restDuration?: {
    value: number;
    unit: string;
  };
  notes?: string;
}

interface Workout {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description?: string;
  workoutType: string;
  difficulty: string;
  segments: WorkoutSegment[];
  targetPowerZones?: string[];
  targetHeartRateZones?: string[];
  equipment?: string[];
  tags?: string[];
  status: string;
}

async function getWorkout(slug: string): Promise<Workout | null> {
  try {
    console.log("Fetching workout with slug:", slug);

    // Debug: Check all workouts to see what's available
    const allWorkouts = await client.fetch(ALL_WORKOUTS_DEBUG_QUERY);
    console.log("All workouts in dataset:", allWorkouts);

    const workout = await client.fetch<Workout>(WORKOUT_QUERY, { slug });
    console.log("Fetched workout:", workout);

    if (!workout) {
      console.warn(`No workout found with slug: "${slug}"`);
      console.log(
        "Available slugs:",
        allWorkouts.map((w: { slug: string }) => w.slug)
      );
    }

    return workout;
  } catch (error) {
    console.error("Error fetching workout:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: WorkoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const workout = await getWorkout(slug);

  if (!workout) {
    return {
      title: "Workout Not Found",
    };
  }

  return {
    title: workout.title,
    description:
      workout.description || `Cycling workout: ${workout.workoutType}`,
  };
}

function formatDuration(duration: { value: number; unit: string }): string {
  return `${duration.value} ${duration.unit}`;
}

function formatPowerTarget(
  powerTarget?: WorkoutSegment["powerTarget"]
): string {
  if (!powerTarget) return "N/A";

  if (powerTarget.percentFTP) {
    return `${powerTarget.percentFTP}% FTP`;
  }

  if (powerTarget.initialPercentFTP && powerTarget.finalPercentFTP) {
    return `${powerTarget.initialPercentFTP}% → ${powerTarget.finalPercentFTP}% FTP`;
  }

  return "N/A";
}

function formatHeartRateTarget(
  heartRateTarget?: WorkoutSegment["heartRateTarget"]
): string {
  if (!heartRateTarget) return "N/A";

  const parts: string[] = [];
  if (heartRateTarget.zone) {
    parts.push(heartRateTarget.zone);
  }
  if (heartRateTarget.bpm) {
    parts.push(`${heartRateTarget.bpm} BPM`);
  }

  return parts.length > 0 ? parts.join(" - ") : "N/A";
}

function formatCadenceTarget(
  cadenceTarget?: WorkoutSegment["cadenceTarget"]
): string {
  if (!cadenceTarget) return "N/A";

  if (cadenceTarget.rpm) {
    return `${cadenceTarget.rpm} RPM`;
  }

  if (cadenceTarget.range?.min && cadenceTarget.range?.max) {
    return `${cadenceTarget.range.min}-${cadenceTarget.range.max} RPM`;
  }

  return "N/A";
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { slug } = await params;
  console.log("slug", slug);
  const workout = await getWorkout(slug);
  console.log("workout", workout);
  if (!workout) {
    notFound();
  }

  const workoutTypeLabels: Record<string, string> = {
    endurance: "Endurance",
    tempo: "Tempo",
    threshold: "Threshold",
    vo2max: "VO2 Max Intervals",
    sprint: "Sprint Intervals",
    recovery: "Recovery",
    sweetspot: "Sweet Spot",
    overunder: "Over/Under",
  };

  const difficultyLabels: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    professional: "Professional",
  };

  const segmentTypeLabels: Record<string, string> = {
    rampUp: "Ramp Up",
    steady: "Steady",
    free: "Free",
    rampDown: "Ramp Down",
  };

  return (
    <>
      <WorkoutPowerDisplay segments={workout.segments} />
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem",
          width: "100%",
        }}
      >
        <article>
          <header style={{ marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              {workout.title}
            </h1>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "16px",
                  backgroundColor: "var(--gray-alpha-100)",
                  fontSize: "0.875rem",
                }}
              >
                {workoutTypeLabels[workout.workoutType] || workout.workoutType}
              </span>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "16px",
                  backgroundColor: "var(--gray-alpha-100)",
                  fontSize: "0.875rem",
                }}
              >
                {difficultyLabels[workout.difficulty] || workout.difficulty}
              </span>
            </div>
            {workout.description && (
              <p
                style={{ fontSize: "1.125rem", color: "var(--gray-alpha-700)" }}
              >
                {workout.description}
              </p>
            )}
          </header>

          {workout.targetPowerZones && workout.targetPowerZones.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                Target Power Zones
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {workout.targetPowerZones.map((zone) => (
                  <span
                    key={zone}
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(0, 123, 255, 0.1)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {zone}
                  </span>
                ))}
              </div>
            </section>
          )}

          {workout.targetHeartRateZones &&
            workout.targetHeartRateZones.length > 0 && (
              <section style={{ marginBottom: "2rem" }}>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Target Heart Rate Zones
                </h2>
                <div
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  {workout.targetHeartRateZones.map((zone) => (
                    <span
                      key={zone}
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 0, 0, 0.1)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </section>
            )}

          <WorkoutGraphWrapper segments={workout.segments} />

          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              Workout Segments
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {workout.segments.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--gray-alpha-100)",
                    border: "1px solid var(--gray-alpha-200)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                      Segment {index + 1}:{" "}
                      {segmentTypeLabels[segment.segmentType] ||
                        segment.segmentType}
                    </h3>
                    {segment.repetitions && (
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "16px",
                          backgroundColor: "rgba(0, 255, 0, 0.1)",
                          fontSize: "0.875rem",
                        }}
                      >
                        ×{segment.repetitions}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <strong>Duration:</strong>{" "}
                      {formatDuration(segment.duration)}
                    </div>
                    <div>
                      <strong>Power Target:</strong>{" "}
                      {formatPowerTarget(segment.powerTarget)}
                    </div>
                    {segment.heartRateTarget && (
                      <div>
                        <strong>Heart Rate:</strong>{" "}
                        {formatHeartRateTarget(segment.heartRateTarget)}
                      </div>
                    )}
                    {segment.cadenceTarget && (
                      <div>
                        <strong>Cadence:</strong>{" "}
                        {formatCadenceTarget(segment.cadenceTarget)}
                      </div>
                    )}
                    {segment.restDuration && (
                      <div>
                        <strong>Rest:</strong>{" "}
                        {formatDuration(segment.restDuration)}
                      </div>
                    )}
                  </div>

                  {segment.notes && (
                    <div
                      style={{
                        marginTop: "1rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--gray-alpha-200)",
                      }}
                    >
                      <strong>Notes:</strong>
                      <p
                        style={{
                          marginTop: "0.5rem",
                          color: "var(--gray-alpha-700)",
                        }}
                      >
                        {segment.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {workout.equipment && workout.equipment.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                Required Equipment
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {workout.equipment.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "8px",
                      backgroundColor: "var(--gray-alpha-100)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {workout.tags && workout.tags.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                Tags
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {workout.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "8px",
                      backgroundColor: "var(--gray-alpha-100)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
