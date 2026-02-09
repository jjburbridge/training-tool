import { anthropic } from "@ai-sdk/anthropic";
import { createMCPClient } from "@ai-sdk/mcp";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { CLIENT_TOOLS, UserContext } from "../../lib/chatbot/clientTools";
import z from "zod";

const clientTools = {
  [CLIENT_TOOLS.PAGE_CONTEXT]: {
    description: `Page context as markdown: URL, title, and text content (headings, links, lists). Fast. No visuals.`,
    inputSchema: z.object({
      reason: z.string().describe("Why you need page context"),
    }),
  },
  [CLIENT_TOOLS.SCREENSHOT]: {
    description: `Visual screenshot of the page. You CANNOT see anything visual without this - no images, colors, layout, or appearance.`,
    inputSchema: z.object({
      reason: z.string().describe("Why you need a screenshot"),
    }),
  },
};

const getSystemPrompt = () => {
  return `You are a helpful training assistant for a cycling workout app. You have access to workout content stored in Sanity CMS.
  You are helping on {{ documentTitle }} at {{ documentLocation }}.

## Your Capabilities
- Search and browse cycling workouts (endurance, tempo, threshold, VO2 max, sprint, recovery, sweet spot, over/under)
- Find workouts by type, difficulty (beginner, intermediate, advanced, professional), or equipment needs
- Explain workout structure, segments, power zones, and heart rate targets
- Recommend workouts based on user goals and fitness level

## Content Types
- **workout**: Cycling workouts with title, description, type, difficulty, segments, power zones, equipment
- **workoutPlan**: Multi-workout plans (if available)
- **workoutSegment**: Individual segments within a workout (duration, power targets, cadence, etc.)

## How to Respond
- Be concise and practical
- Use markdown for readable formatting: **bold** for emphasis, lists with - or 1., headers with ## when appropriate
- When recommending workouts or workout plans, ALWAYS include links: [Workout Title](/workout/slug) or [Plan Title](/workout-plans/slug)
- Use the slug.current value from the document for the URL path
- Include key details: type, difficulty, target zones
- Example: "I recommend [Endurance Builder](/workout/endurance-builder) for base training - it's an **intermediate** workout targeting zone 2."
- If you can't find matching content, suggest alternatives or explain what's available

## Tool Usage
- Use initial_context first to understand available content types and counts
- Use groq_query to find specific workouts—filter by _type, workoutType, difficulty, status
- Use schema_explorer when you need field details for a document type
- For published workouts only, use: status == "published" or !(_id in path("drafts.**"))
- Use get_page_context to see what page the user is on (URL, title, headings, links). Call it when relevant to tailor your response—e.g. when recommending alternatives to the workout they're viewing, or when they ask "what's on this page".`;
};

function buildSystemPrompt(props: {template: string; userContext: UserContext}) {
  const {template, userContext} = props

  const vars: Record<string, string> = {
    documentTitle: userContext.documentTitle,
    documentLocation: userContext.documentLocation,
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? '')
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  if (!process.env.SANITY_CONTEXT_MCP_URL) {
    throw new Error(
      "SANITY_CONTEXT_MCP_URL is not set. Create an Agent Context in Sanity Studio and add the MCP URL to .env.local",
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: process.env.SANITY_CONTEXT_MCP_URL,
      headers: {
        Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}`,
      },
    },
  });

  const systemPrompt = buildSystemPrompt({
    template: getSystemPrompt(),
    userContext,
  })

  const mcpTools = await mcpClient.tools();

  try {
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: {
        ...mcpTools,
        ...clientTools,
      },
      stopWhen: stepCountIs(10),
      onFinish: async () => {
        await mcpClient.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    await mcpClient.close();
    throw error;
  }
}
