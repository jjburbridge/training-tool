import type { Metadata } from "next";
import { client } from "../lib/sanity/client";
import {
  WORKOUT_PLANS_PAGINATED_QUERY,
  WORKOUT_PLANS_COUNT_QUERY,
} from "../lib/sanity/queries";
import { WorkoutPlansList } from "../components/WorkoutPlansList";
import styles from "../layout.module.css";

export const metadata: Metadata = {
  title: "Workout Plans | Training Tool",
  description: "Browse all workout plans",
};

const PAGE_SIZE = 10;

export default async function WorkoutPlansPage() {
  const [workoutPlans, total] = await Promise.all([
    client.fetch(WORKOUT_PLANS_PAGINATED_QUERY, { offset: 0, end: PAGE_SIZE }),
    client.fetch<number>(WORKOUT_PLANS_COUNT_QUERY),
  ]);

  return (
    <div className={styles.listPage}>
      <header className={styles.listPageHeader}>
        <h1 className={styles.listPageHeaderTitle}>Workout Plans</h1>
        <p className={styles.listPageHeaderMeta}>
          {total} plan{total !== 1 ? "s" : ""} available
        </p>
      </header>
      <WorkoutPlansList initialPlans={workoutPlans} initialTotal={total} />
    </div>
  );
}
