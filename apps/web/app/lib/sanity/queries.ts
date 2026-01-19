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
