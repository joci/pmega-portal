export type FlashMessage = {
  text: string
  type?: 'primary' | 'red' | 'yellow' | 'green' | 'blue' | 'gray'
}

export const useFlashMessage = () => {
  const flash = useState<FlashMessage | null>('flash-message', () => null)

  const setFlashMessage = (message: FlashMessage) => {
    flash.value = message
  }

  const consumeFlashMessage = () => {
    const message = flash.value
    flash.value = null
    return message
  }

  const clearFlashMessage = () => {
    flash.value = null
  }

  return {
    flashMessage: flash,
    setFlashMessage,
    consumeFlashMessage,
    clearFlashMessage
  }
}
