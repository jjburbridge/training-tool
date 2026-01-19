# Sanity Studio

This is the Sanity Studio application for managing content in the Training Tool project.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment variables:
   Create a `.env.local` file with:
   ```
   SANITY_STUDIO_PROJECT_ID=your-project-id
   SANITY_STUDIO_DATASET=production
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

## Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the studio for production
- `pnpm start` - Start the production server
- `pnpm schema:extract` - Extract schema types
- `pnpm typegen` - Generate TypeScript types from GROQ queries

## Schema Types

Schema types are located in `src/schemaTypes/`. Each schema type should:
- Be written to its own file
- Export a named const that matches the filename
- Use `defineType`, `defineField`, and `defineArrayMember` helpers
- Include icons, previews, and validation as appropriate

