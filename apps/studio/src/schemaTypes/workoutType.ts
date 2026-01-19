import { defineField, defineType, defineArrayMember } from "sanity";
import { PlayIcon } from "@sanity/icons";
import { workoutSegmentType } from "./workoutSegmentType";

export const workoutType = defineType({
  name: "workout",
  title: "Cycling Workout",
  type: "document",
  icon: PlayIcon,
  groups: [
    {
      name: "details",
      title: "Details",
      default: true,
    },
    {
      name: "structure",
      title: "Structure",
    },
    {
      name: "targets",
      title: "Targets",
    },
    {
      name: "metadata",
      title: "Metadata",
    },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "details",
      validation: (rule) => rule.required().error("Title is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
    defineField({
      name: "description",
      type: "text",
      group: "details",
      description: "Brief description of the workout",
      validation: (rule) =>
        rule.max(300).warning("Description should be concise, under 300 characters"),
    }),
    defineField({
      name: "workoutType",
      type: "string",
      title: "Workout Type",
      group: "details",
      options: {
        list: [
          { title: "Endurance", value: "endurance" },
          { title: "Tempo", value: "tempo" },
          { title: "Threshold", value: "threshold" },
          { title: "VO2 Max Intervals", value: "vo2max" },
          { title: "Sprint Intervals", value: "sprint" },
          { title: "Recovery", value: "recovery" },
          { title: "Sweet Spot", value: "sweetspot" },
          { title: "Over/Under", value: "overunder" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Workout type is required"),
    }),
    defineField({
      name: "difficulty",
      type: "string",
      group: "details",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
          { title: "Professional", value: "professional" },
        ],
        layout: "radio",
      },
      initialValue: "intermediate",
      validation: (rule) => rule.required().error("Difficulty level is required"),
    }),
    defineField({
      name: "segments",
      type: "array",
      title: "Workout Segments",
      group: "structure",
      of: [defineArrayMember(workoutSegmentType)],
      validation: (rule) =>
        rule.min(1).error("Workout must have at least one segment"),
    }),
    defineField({
      name: "targetPowerZones",
      type: "array",
      title: "Target Power Zones",
      group: "targets",
      of: [
        defineArrayMember({
          type: "string",
          options: {
            list: [
              { title: "Zone 1 (Active Recovery)", value: "zone1" },
              { title: "Zone 2 (Endurance)", value: "zone2" },
              { title: "Zone 3 (Tempo)", value: "zone3" },
              { title: "Zone 4 (Threshold)", value: "zone4" },
              { title: "Zone 5 (VO2 Max)", value: "zone5" },
              { title: "Zone 6 (Neuromuscular)", value: "zone6" },
            ],
          },
        }),
      ],
      description: "Primary power zones targeted in this workout",
    }),
    defineField({
      name: "targetHeartRateZones",
      type: "array",
      title: "Target Heart Rate Zones",
      group: "targets",
      of: [
        defineArrayMember({
          type: "string",
          options: {
            list: [
              { title: "Zone 1 (50-60% HRmax)", value: "zone1" },
              { title: "Zone 2 (60-70% HRmax)", value: "zone2" },
              { title: "Zone 3 (70-80% HRmax)", value: "zone3" },
              { title: "Zone 4 (80-90% HRmax)", value: "zone4" },
              { title: "Zone 5 (90-100% HRmax)", value: "zone5" },
            ],
          },
        }),
      ],
      description: "Primary heart rate zones targeted in this workout",
    }),
    defineField({
      name: "equipment",
      type: "array",
      title: "Required Equipment",
      group: "metadata",
      of: [
        defineArrayMember({
          type: "string",
          options: {
            list: [
              { title: "Indoor Trainer", value: "trainer" },
              { title: "Road Bike", value: "road" },
              { title: "Mountain Bike", value: "mtb" },
              { title: "Power Meter", value: "powermeter" },
              { title: "Heart Rate Monitor", value: "hrm" },
              { title: "Cadence Sensor", value: "cadence" },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: "tags",
      type: "array",
      title: "Tags",
      group: "metadata",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "status",
      type: "string",
      group: "metadata",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
    }),
  ],
  preview: {
    select: {
      title: "title",
      workoutType: "workoutType",
      difficulty: "difficulty",
      duration: "totalDuration.value",
      durationUnit: "totalDuration.unit",
      status: "status",
    },
    prepare({ title, workoutType, difficulty, duration, durationUnit, status }) {
      const durationText =
        duration && durationUnit ? `${duration} ${durationUnit}` : "No duration";
      return {
        title,
        subtitle: `${workoutType || "No type"} • ${difficulty || "No difficulty"} • ${durationText}${status ? ` • ${status}` : ""}`,
      };
    },
  },
});

