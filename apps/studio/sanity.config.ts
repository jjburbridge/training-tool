/* eslint-disable turbo/no-undeclared-env-vars */
import { AssetSource, defineConfig } from "sanity";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/schemaTypes";
import { structureTool } from "sanity/structure";
import { media, mediaAssetSource } from "sanity-plugin-media";

export default defineConfig({
  name: "default",
  title: "Training Tool Studio",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "ikcwiihw",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  basePath: "/studio",
  plugins: [structureTool(), visionTool(), media()],
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
