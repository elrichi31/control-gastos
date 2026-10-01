import { handleOAuth } from '@/lib/mcp/runtime'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const GET = (request: Request) => handleOAuth('authorizeGet', request)
export const POST = (request: Request) => handleOAuth('authorizePost', request)
