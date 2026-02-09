/* eslint-disable turbo/no-undeclared-env-vars */
import { AssetSource, defineConfig } from "sanity";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/schemaTypes";
import {
  structureTool,
  type ListItemBuilder,
  type StructureBuilder,
} from "sanity/structure";
import { media, mediaAssetSource } from "sanity-plugin-media";
import {
  agentContextPlugin,
  AGENT_CONTEXT_SCHEMA_TYPE_NAME,
} from "@sanity/agent-context/studio";

export default defineConfig({
  name: "default",
  title: "Training Tool Studio",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "ikcwiihw",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S: StructureBuilder) => {
        const defaultListItems = S.documentTypeListItems().filter(
          (item: ListItemBuilder) =>
            item.getId() !== AGENT_CONTEXT_SCHEMA_TYPE_NAME,
        );
        return S.list()
          .title("Content")
          .items([
            ...defaultListItems,
            S.divider(),
            S.listItem()
              .title("Agents")
              .child(
                S.list()
                  .title("Agents")
                  .items([
                    S.documentTypeListItem(
                      AGENT_CONTEXT_SCHEMA_TYPE_NAME,
                    ).title("Agent Contexts"),
                  ]),
              ),
          ]);
      },
    }),
    visionTool(),
    media(),
    agentContextPlugin(),
  ],
  schema: {
    types: schemaTypes,
  },
  form: {
    file: {
      assetSources: (previousAssetSources: AssetSource[]) => {
        return previousAssetSources.filter(
          (assetSource) => assetSource !== mediaAssetSource,
        );
      },
    },
    image: {
      assetSources: (previousAssetSources: AssetSource[]) => {
        return previousAssetSources.filter(
          (assetSource) => assetSource === mediaAssetSource,
        );
      },
    },
  },
});
