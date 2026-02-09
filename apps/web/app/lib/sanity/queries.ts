import { groq } from "next-sanity";

export const WORKOUT_QUERY = groq`*[
  _type == "workout"
  && slug.current == $slug
][0]{
  _id,
  title,
  slug,
  description,
  workoutType,
  difficulty,
  segments[]{
    segmentType,
    duration{
      value,
      unit
    },
    powerTarget{
      percentFTP,
      initialPercentFTP,
      finalPercentFTP
    },
    heartRateTarget{
      zone,
      bpm
    },
    cadenceTarget{
      rpm,
      range{
        min,
        max
      }
    },
    repetitions,
    restDuration{
      value,
      unit
    },
    notes
  },
  targetPowerZones,
  targetHeartRateZones,
  equipment,
  tags,
  status
}`;

// Debug query to check all workouts
export const ALL_WORKOUTS_DEBUG_QUERY = groq`*[
  _type == "workout"
]{
  _id,
  title,
  "slug": slug.current,
  status
}`;

export const WORKOUTS_QUERY = groq`*[
  _type == "workout"
  && status == "published"
] | order(_createdAt desc){
  _id,
  title,
  slug,
  description,
  workoutType,
  difficulty,
  "slug": slug.current
}`;

// Paginated workouts query (offset, end - use offset and offset+pageSize)
export const WORKOUTS_PAGINATED_QUERY = groq`*[
  _type == "workout"
  && status == "published"
] | order(_createdAt desc)[$offset...$end]{
  _id,
  title,
  slug,
  description,
  workoutType,
  difficulty,
  "slug": slug.current
}`;

// Count total workouts for pagination
export const WORKOUTS_COUNT_QUERY = groq`count(*[
  _type == "workout"
  && status == "published"
])`;

// Paginated workout plans query (offset, end)
export const WORKOUT_PLANS_PAGINATED_QUERY = groq`*[
  _type == "workoutPlan"
  && status == "published"
] | order(_createdAt desc)[$offset...$end]{
  _id,
  title,
  slug,
  description,
  planType,
  duration,
  targetLevel,
  "workoutCount": count(workouts),
  "slug": slug.current
}`;

// Count total workout plans for pagination
export const WORKOUT_PLANS_COUNT_QUERY = groq`count(*[
  _type == "workoutPlan"
  && status == "published"
])`;

// Single workout plan by slug
export const WORKOUT_PLAN_QUERY = groq`*[
  _type == "workoutPlan"
  && slug.current == $slug
  && status == "published"
][0]{
  _id,
  title,
  slug,
  description,
  planType,
  duration,
  targetLevel,
  workouts[]->{
    _id,
    title,
    "slug": slug.current
  }
}`;
