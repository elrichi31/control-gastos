/** UA is available on the first request; installed desktop PWA supplies an explicit entry hint. */
export function mobileEntryTarget(pathname: string, userAgent: string, pwa: boolean, authenticated: boolean) {
  if (pathname !== '/' || (!pwa && !/iPhone|iPad|iPod|Android/i.test(userAgent))) return null
  return authenticated ? '/form' : '/auth/login'
}
