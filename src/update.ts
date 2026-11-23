/** Throws away the app's saved offline copy and reloads from the network. Cards and decks are not touched. */
export async function forceUpdate() {
  const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
  await Promise.all(regs.map((r) => r.unregister()))
  if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
  location.reload()
}

export const buildLabel = () => new Date(__BUILD__).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
