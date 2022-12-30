import { useHotkeys } from "react-hotkeys-hook"

const useHotKeyCallback = (
	keycode: string | undefined,
	callback: Parameters<typeof useHotkeys>[1] | undefined,
	enabled?: boolean
) => {
	// This may not be the best function to determine this, but it works for now.
	const isTypeable = keycode?.length === 1
	return useHotkeys(
		keycode || "",
		(event, handler) => {
			event.preventDefault()
			callback?.(event, handler)
		},
		{
			enabled: enabled !== false && !!keycode,
			enableOnTags: !isTypeable
				? ["INPUT", "TEXTAREA", "SELECT"]
				: undefined,
		}
	)
}

export { useHotKeyCallback }
