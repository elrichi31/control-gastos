/** Only the OAuth consent route may override the normal post-login dashboard. */
export function safeLoginReturn(value?: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f]/.test(value)) return '/dashboard'
  const url = new URL(value, 'https://local.invalid')
  return url.origin === 'https://local.invalid' && url.pathname === '/api/mcp/oauth/authorize' && !url.hash ? value : '/dashboard'
}
