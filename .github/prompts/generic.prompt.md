---
mode: agent
---

# Development Guidelines for Control-Gastos

## Core Principles
- **Component Separation**: Always create new functionality separated into manageable components with single responsibility
- **DRY (Don't Repeat Yourself)**: Reuse existing code and components instead of duplicating functionality
- **KISS (Keep It Simple, Stupid)**: Write readable, maintainable code that's easy to understand
- **No Proactivity**: Only create exactly what is requested, no additional features or files

## Architecture Requirements

### Component Structure
- Each component should handle one specific piece of logic
- Keep component functions manageable in length
- Extract complex logic into custom hooks when appropriate
- Reuse existing components and utilities from the codebase
- **Always use shadcn/ui components** from `src/components/ui/` for UI elements
- If a shadcn component is needed but not installed, use: `npx shadcn@latest add [component-name]`

### API Management
- All database operations go through `/src/app/api/` routes
- Follow the existing pattern: `getAuthenticatedSupabaseClient()` → query with `user_id` filter
- No migrations - database changes require manual SQL execution

### Database Operations
- For database-related scripts or utilities, create: `db/filename.sql` or `db/filename.ts`
- Use existing Supabase client patterns from `/src/lib/database/`

## Response Format
After completing any task, provide only a **brief summary** of what was created/modified:
- List new files created
- List existing files modified
- Summarize the functionality implemented
- **Never create full explanatory files or documentation**

## Forbidden Actions
- Creating additional features not explicitly requested
- Writing lengthy explanations in separate files
- Being proactive with "nice-to-have" additions
- Duplicating existing functionality instead of reusing

Define the task to achieve, including specific requirements, constraints, and success criteria based on these guidelines.