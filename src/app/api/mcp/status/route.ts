import { handleMcpStatus } from '@/lib/mcp/runtime'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const GET = () => handleMcpStatus()
