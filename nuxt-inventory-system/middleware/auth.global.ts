export default defineNuxtRouteMiddleware(async (to) => {
  const { user, isLoaded, loadSession } = useAuth()
  const localePath = useLocalePath()
  const isLoginRoute = to.path.includes('/login')

  if (!isLoaded.value) {
    await loadSession()
  }

  if (isLoginRoute) {
    if (user.value) {
      return navigateTo(localePath('/'))
    }
    return
  }

  if (!user.value) {
    return navigateTo(localePath('/login'))
  }
})
