import { defineField, defineType } from "sanity";

export const workoutSegmentType = defineType({
  name: "workoutSegment",
  title: "Workout Segment",
  type: "object",
  fields: [
    defineField({
      name: "segmentType",
      type: "string",
      options: {
        list: [
          { title: "Ramp up", value: "rampUp" },
          { title: "Steady", value: "steady" },
          { title: "Free", value: "free" },
          { title: "Ramp Down", value: "rampDown" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required().error("Segment type is required"),
    }),
    defineField({
      name: "duration",
      type: "object",
      fieldsets: [{ name: "duration", options: { columns: 2 } }],
      fields: [
        defineField({
          name: "value",
          type: "number",
          title: "Duration",
          description: "Duration value",
          validation: (rule) => rule.required().error("Duration value is required"),
        }),
        defineField({
          name: "unit",
          type: "string",
          title: "Unit",
          options: {
            list: [
              { title: "Minutes", value: "minutes" },
              { title: "Seconds", value: "seconds" },
              { title: "Kilometers", value: "km" },
              { title: "Miles", value: "miles" },
            ],
            layout: "radio",
          },
          initialValue: "minutes",
          validation: (rule) => rule.required().error("Duration unit is required"),
        }),
      ],
      validation: (rule) => rule.required().error("Duration is required"),
    }),
    defineField({
      name: "powerTarget",
      type: "object",
      fieldsets: [{ name: "power", options: { columns: 2 } }],
      fields: [
        defineField({
          name: "percentFTP",
          type: "number",
          title: "% FTP",
          description: "Percentage of Functional Threshold Power",
          hidden: (context) =>
            context.parent?.segmentType === "steady"
        }),
        defineField({
          name: "initialPercentFTP",
          type: "number",
          title: "Initial % FTP",
          description: "Starting Percentage of Functional Threshold Power",
          hidden: (context) => {
            return context.parent?.segmentType === "rampUp" || context.parent?.segmentType === "rampDown"
          }
        }),
        defineField({
          name: "finalPercentFTP",
          type: "number",
          title: "Final % FTP",
          description: "Ending Percentage of Functional Threshold Power",
          hidden: (context) => {
            console.log(context);
            return context.parent?.segmentType === "rampUp" || context.parent?.segmentType === "rampDown"
          }
        }),
      ],
    }),
    defineField({
      name: "heartRateTarget",
      type: "object",
      fieldsets: [{ name: "heartRate", options: { columns: 2 } }],
      fields: [
        defineField({
          name: "zone",
          type: "string",
          options: {
            list: [
              { title: "Zone 1 (50-60% HRmax)", value: "zone1" },
              { title: "Zone 2 (60-70% HRmax)", value: "zone2" },
              { title: "Zone 3 (70-80% HRmax)", value: "zone3" },
              { title: "Zone 4 (80-90% HRmax)", value: "zone4" },
              { title: "Zone 5 (90-100% HRmax)", value: "zone5" },
            ],
            layout: "radio",
          },
        }),
        defineField({
          name: "bpm",
          type: "number",
          title: "BPM",
          description: "Target heart rate in beats per minute",
        }),
      ],
    }),
    defineField({
      name: "cadenceTarget",
      type: "object",
      fieldsets: [{ name: "cadence", options: { columns: 2 } }],
      fields: [
        defineField({
          name: "rpm",
          type: "number",
          title: "RPM",
          description: "Target cadence in revolutions per minute",
          validation: (rule) =>
            rule.min(40).max(120).warning("Cadence typically ranges from 40-120 RPM"),
        }),
        defineField({
          name: "range",
          type: "object",
          title: "Range",
          fields: [
            defineField({
              name: "min",
              type: "number",
              title: "Min RPM",
            }),
            defineField({
              name: "max",
              type: "number",
              title: "Max RPM",
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "repetitions",
      type: "number",
      description: "Number of times to repeat this segment (for interval workouts)",
      validation: (rule) => rule.min(1).max(100).warning("Repetitions should be between 1-100"),
    }),
    defineField({
      name: "restDuration",
      type: "object",
      title: "Rest Duration",
      description: "Rest period after this segment (for intervals)",
      fieldsets: [{ name: "rest", options: { columns: 2 } }],
      fields: [
        defineField({
          name: "value",
          type: "number",
          title: "Duration",
        }),
        defineField({
          name: "unit",
          type: "string",
          title: "Unit",
          options: {
            list: [
              { title: "Minutes", value: "minutes" },
              { title: "Seconds", value: "seconds" },
            ],
            layout: "radio",
          },
          initialValue: "minutes",
        }),
      ],
    }),
    defineField({
      name: "notes",
      type: "text",
      description: "Additional instructions or notes for this segment",
    }),
  ],
  preview: {
    select: {
      segmentType: "segmentType",
      durationValue: "duration.value",
      durationUnit: "duration.unit",
      powerZone: "powerTarget.zone",
      cadence: "cadenceTarget.rpm",
      repetitions: "repetitions",
    },
    prepare({ segmentType, durationValue, durationUnit, powerZone, cadence, repetitions }) {
      const duration = durationValue && durationUnit ? `${durationValue} ${durationUnit}` : "No duration";
      const power = powerZone ? `Power: ${powerZone}` : "";
      const cadenceText = cadence ? `Cadence: ${cadence} RPM` : "";
      const reps = repetitions ? `×${repetitions}` : "";
      
      const parts = [segmentType, duration, power, cadenceText, reps].filter(Boolean);
      return {
        title: parts.join(" • "),
      };
    },
  },
});

