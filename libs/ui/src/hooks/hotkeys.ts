import { useHotkeys } from "react-hotkeys-hook"

const useHotKeyCallback = (
  keycode: string | undefined,
  callback: Parameters<typeof useHotkeys>[1] | undefined,
  enabled?: boolean,
  dependencies?: unknown[],
) => {
  // Prevent single-character hotkeys from being triggered when typing in a form field
  const isTypeable = keycode?.length === 1
  return useHotkeys(
    keycode || "",
    (event, handler) => {
      event.preventDefault()
      callback?.(event, handler)
    },
    {
      enabled: enabled !== false && !!keycode,
      enableOnFormTags: !isTypeable
        ? ["INPUT", "TEXTAREA", "SELECT"]
        : undefined,
    },
    dependencies,
  )
}

export { useHotKeyCallback }
