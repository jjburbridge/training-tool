import type { Metadata } from "next";
import { client } from "../lib/sanity/client";
import {
  WORKOUTS_PAGINATED_QUERY,
  WORKOUTS_COUNT_QUERY,
} from "../lib/sanity/queries";
import { WorkoutsList } from "../components/WorkoutsList";
import styles from "../layout.module.css";

export const metadata: Metadata = {
  title: "Workouts | Training Tool",
  description: "Browse all cycling workouts",
};

const PAGE_SIZE = 10;

export default async function WorkoutsPage() {
  const [workouts, total] = await Promise.all([
    client.fetch(WORKOUTS_PAGINATED_QUERY, { offset: 0, end: PAGE_SIZE }),
    client.fetch<number>(WORKOUTS_COUNT_QUERY),
  ]);

  return (
    <div className={styles.listPage}>
      <header className={styles.listPageHeader}>
        <h1 className={styles.listPageHeaderTitle}>Workouts</h1>
        <p className={styles.listPageHeaderMeta}>
          {total} workout{total !== 1 ? "s" : ""} available
        </p>
      </header>
      <WorkoutsList initialWorkouts={workouts} initialTotal={total} />
    </div>
  );
}
