# Copilot Instructions

## Project Overview
This is a **expense tracking application** ("control-gastos") built with Next.js 15, TypeScript, Supabase, and NextAuth.js. It features budget management, recurring expenses, statistics, and multi-user authentication.

## Architecture & Key Patterns

### Authentication Architecture
- **Hybrid Auth System**: Uses NextAuth.js as the session layer with Supabase Auth as the backend
- **Critical Pattern**: `getAuthenticatedSupabaseClient()` in `src/lib/auth/auth-supabase.ts` bridges NextAuth sessions with Supabase queries
- **RLS Issue**: Row Level Security (RLS) policies expect `auth.uid()` but NextAuth provides `session.user.id` - this requires manual user_id filtering in queries
- **Middleware**: `src/middleware.ts` handles auth redirects and route protection

### Database & Services Layer
- **Supabase Integration**: Uses `@supabase/ssr` for server-side rendering with cookie-based sessions
- **Service Pattern**: All database operations are abstracted through services in `src/services/` (expenses, categories, budget, etc.)
- **API Routes**: Each entity has its own API route in `src/app/api/` that uses `getAuthenticatedSupabaseClient()`
- **Type Safety**: Comprehensive TypeScript interfaces in `src/types/` with backward compatibility aliases

### Component Architecture
- **Feature-Based Organization**: Components are grouped by domain (`src/components/detalle-gastos/`, `src/components/presupuesto/`, etc.)
- **Custom Hooks**: Business logic is extracted to hooks in `src/hooks/` (e.g., `useExpenseFilters`, `useBudgetCalculations`)
- **UI Components**: Uses shadcn/ui components (Radix UI + Tailwind CSS) in `src/components/ui/`
- **shadcn/ui**: Always use shadcn components for UI elements. If a needed component is missing, install it with `npx shadcn@latest add [component-name]`

### Data Flow Patterns
- **Server-Side First**: Most data fetching happens in API routes, not client-side
- **User Isolation**: All queries must include `.eq('user_id', userId)` for multi-tenant data isolation
- **Date Handling**: Uses `date-fns` extensively; dates stored as "YYYY-MM-DD" strings in database

## Critical Development Commands
```bash
npm run dev              # Development server
npm run build            # Production build
npm run lint             # ESLint check
```

## Essential File Locations
- **Auth Configuration**: `src/lib/auth/auth.ts` (NextAuth config)
- **Database Clients**: `src/lib/database/` (browser, server, and legacy clients)
- **API Pattern**: `src/app/api/[entity]/route.ts` (standard CRUD operations)
- **Constants**: `src/lib/constants/app.ts` (months, payment methods, endpoints)
- **Types**: `src/types/common.ts` (shared interfaces)

## Specific Conventions

### Database Queries
```typescript
// Always use authenticated client and filter by user_id
const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient();
if (authError) return authError;

const { data, error } = await supabase
  .from('gasto')
  .select('*')
  .eq('user_id', userId); // Always include this
```

### API Route Structure
```typescript
// Standard pattern for all API routes
export async function GET() {
  const { error: authError, supabase, userId } = await getAuthenticatedSupabaseClient();
  if (authError) return authError;
  
  // Query with user isolation
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error message' }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### Component Patterns
- **UI Library**: Use shadcn/ui components from `src/components/ui/` for all UI elements (Button, Input, Dialog, etc.)
- **Loading States**: Use `react-hot-toast` for notifications, custom loading states in components
- **Date Filtering**: Components expect dates as "YYYY-MM-DD" strings, use `toDateWithTime()` utility
- **Mobile Responsive**: All components must work on mobile (hooks like `useMobile()` available)

## Environment Setup
Required variables in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

## Common Gotchas
- **RLS vs NextAuth**: When RLS is enabled in Supabase, queries may fail because `auth.uid()` returns null with NextAuth sessions
- **Date Formats**: Always use "YYYY-MM-DD" for database storage, convert for display as needed
- **User Context**: Never query without user_id filtering - all data is user-scoped
- **Legacy Hooks**: `src/hooks/useAuth.tsx` exists but is mostly unused - actual auth handled by NextAuth