import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { client } from "../../lib/sanity/client";
import styles from "../../layout.module.css";
import { WORKOUT_PLAN_QUERY } from "../../lib/sanity/queries";

interface WorkoutPlanPageProps {
  params: Promise<{ slug: string }>;
}

interface WorkoutRef {
  _id: string;
  title: string;
  slug: string;
}

interface WorkoutPlan {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  planType?: string;
  duration?: { value?: number; unit?: string };
  targetLevel?: string;
  workouts?: WorkoutRef[];
}

async function getWorkoutPlan(slug: string): Promise<WorkoutPlan | null> {
  try {
    return await client.fetch<WorkoutPlan | null>(WORKOUT_PLAN_QUERY, {
      slug,
    });
  } catch (error) {
    console.error("Error fetching workout plan:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: WorkoutPlanPageProps): Promise<Metadata> {
  const { slug } = await params;
  const plan = await getWorkoutPlan(slug);
  if (!plan) return { title: "Workout Plan Not Found" };
  return {
    title: `${plan.title} | Training Tool`,
    description: plan.description ?? `Workout plan: ${plan.title}`,
  };
}

export default async function WorkoutPlanPage({ params }: WorkoutPlanPageProps) {
  const { slug } = await params;
  const plan = await getWorkoutPlan(slug);
  if (!plan) notFound();

  const durationText =
    plan.duration?.value && plan.duration?.unit
      ? `${plan.duration.value} ${plan.duration.unit}`
      : null;

  return (
    <div className={styles.detailPage}>
      <Link href="/workout-plans" className={styles.backLink}>
        ← Back to Workout Plans
      </Link>

      <h1 className={styles.detailTitle}>{plan.title}</h1>

      <div className={styles.detailMeta}>
        {plan.planType && (
          <span style={{ textTransform: "capitalize" }}>
            {plan.planType.replace(/([A-Z])/g, " $1").trim()}
          </span>
        )}
        {durationText && <span>{durationText}</span>}
        {plan.targetLevel && (
          <span style={{ textTransform: "capitalize" }}>{plan.targetLevel}</span>
        )}
      </div>

      {plan.description && (
        <p className={styles.detailDescription}>{plan.description}</p>
      )}

      {plan.workouts && plan.workouts.length > 0 && (
        <section>
          <h2 className={styles.detailSectionTitle}>
            Workouts ({plan.workouts.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {plan.workouts.map((workout) => (
              <li key={workout._id} style={{ marginBottom: "0.5rem" }}>
                <Link
                  href={`/workout/${workout.slug}`}
                  className={styles.detailCard}
                >
                  {workout.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
