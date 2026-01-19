import { defineField, defineType, defineArrayMember } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export const workoutPlanType = defineType({
  name: "workoutPlan",
  title: "Workout Plan",
  type: "document",
  icon: CalendarIcon,
  groups: [
    {
      name: "details",
      title: "Details",
      default: true,
    },
    {
      name: "workouts",
      title: "Workouts",
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
      name: "TestingImages",
      title: "Testing Images",
      description: "Images used for internal testing purposes only.",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
        }),
      ],
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
      description: "Description of the training plan",
      validation: (rule) =>
        rule
          .max(500)
          .warning("Description should be concise, under 500 characters"),
    }),
    defineField({
      name: "planType",
      type: "string",
      title: "Plan Type",
      group: "details",
      options: {
        list: [
          { title: "Base Building", value: "base" },
          { title: "Build Phase", value: "build" },
          { title: "Peak", value: "peak" },
          { title: "Recovery", value: "recovery" },
          { title: "Maintenance", value: "maintenance" },
          { title: "Event-Specific", value: "event" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "duration",
      type: "object",
      title: "Plan Duration",
      group: "details",
      fieldsets: [{ name: "duration", options: { columns: 2 } }],
      fields: [
        defineField({
          name: "value",
          type: "number",
          title: "Duration",
          description: "Duration of the plan",
        }),
        defineField({
          name: "unit",
          type: "string",
          title: "Unit",
          options: {
            list: [
              { title: "Weeks", value: "weeks" },
              { title: "Months", value: "months" },
            ],
            layout: "radio",
          },
          initialValue: "weeks",
        }),
      ],
    }),
    defineField({
      name: "workouts",
      type: "array",
      title: "Workouts",
      group: "workouts",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "workout" }],
        }),
      ],
      validation: (rule) =>
        rule.min(1).error("Plan must include at least one workout"),
    }),
    defineField({
      name: "targetLevel",
      type: "string",
      title: "Target Level",
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
      planType: "planType",
      duration: "duration.value",
      durationUnit: "duration.unit",
      workoutCount: "workouts",
      status: "status",
    },
    prepare({ title, planType, duration, durationUnit, workoutCount, status }) {
      const durationText =
        duration && durationUnit
          ? `${duration} ${durationUnit}`
          : "No duration";
      const workouts = workoutCount?.length || 0;
      return {
        title,
        subtitle: `${planType || "No type"} • ${durationText} • ${workouts} workout${workouts !== 1 ? "s" : ""}${status ? ` • ${status}` : ""}`,
      };
    },
  },
});
