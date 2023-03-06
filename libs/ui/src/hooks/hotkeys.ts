import { useHotkeys } from "react-hotkeys-hook"

const useHotKeyCallback = (
	keycode: string | undefined,
	callback: Parameters<typeof useHotkeys>[1] | undefined,
	enabled?: boolean,
	dependencies?: unknown[],
	parentComponentId?: string
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
			enabled: () => {
				if (!keycode || enabled === false) return false
				// If we were provided a parent component id, make sure it is still visible
				if (parentComponentId) {
					const el = document.querySelector(
						`#${CSS.escape(parentComponentId)}`
					) as HTMLElement
					console.log(
						"in enabled handler for parentComponentId: " +
							parentComponentId +
							" ---- found it? " +
							!!el
					)
					if (!el) return false
					return !!(
						el.offsetWidth ||
						el.offsetHeight ||
						el.getClientRects().length
					)
				}
				return true
			},
			enableOnFormTags: !isTypeable
				? ["INPUT", "TEXTAREA", "SELECT"]
				: undefined,
		},
		dependencies
	)
}

export { useHotKeyCallback }
