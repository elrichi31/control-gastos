import { handleOAuth } from '@/lib/mcp/runtime'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const POST = (request: Request) => handleOAuth('token', request)
