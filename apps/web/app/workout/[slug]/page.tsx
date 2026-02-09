import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { client } from "../../lib/sanity/client";
import styles from "../../layout.module.css";
import {
  WORKOUT_QUERY,
  ALL_WORKOUTS_DEBUG_QUERY,
} from "../../lib/sanity/queries";
import { WorkoutDisplay } from "../../components/WorkoutDisplay";

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

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { slug } = await params;
  console.log("slug", slug);
  const workout = await getWorkout(slug);
  console.log("workout", workout);
  if (!workout) {
    notFound();
  }

  return (
    <div style={{ padding: "1rem 1.5rem" }}>
      <Link href="/workouts" className={styles.backLink}>
        ← Back to Workouts
      </Link>
      <WorkoutDisplay workoutTitle={workout.title} segments={workout.segments} />
    </div>
  );
}
