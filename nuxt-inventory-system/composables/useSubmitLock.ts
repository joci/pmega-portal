import { ref } from 'vue'

export const useSubmitLock = () => {
  const isSubmitting = ref(false)

  const runWithLock = async <T>(handler: () => Promise<T> | T): Promise<T | undefined> => {
    if (isSubmitting.value) {
      return undefined
    }
    isSubmitting.value = true
    try {
      return await handler()
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, runWithLock }
}
