import { api, signal } from "@uesio/ui"
import { useEffect } from "react"

type ExpansionState = {
	expanded: boolean
}

const toggleExpansion: signal.ComponentSignalDescriptor<ExpansionState> = {
	dispatcher: (state) => {
		// eslint-disable-next-line no-unneeded-ternary
		state.expanded === !state.expanded
	},
}

const setExpand: signal.ComponentSignalDescriptor<ExpansionState> = {
	dispatcher: (state) => {
		state.expanded = true
	},
}

const setCollapse: signal.ComponentSignalDescriptor<ExpansionState> = {
	dispatcher: (state) => {
		state.expanded = false
	},
}

const useExpansion = (
	id: string
): [boolean | undefined, (expanded: boolean) => void] => {
	const [expanded, setExpanded] = api.component.useStateSlice<boolean>(
		"expansion",
		id,
		false
	)

	useEffect(() => {
		if (!expanded) {
			setExpanded(true)
		}
		// We do NOT want to reset the expansion state whenever expanded changes,
		// so we don't want to add expanded or setExpanded to the deps array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return [expanded, setExpanded]
}

export { toggleExpansion, setExpand, setCollapse, useExpansion }
