import { api, signal } from "@uesio/ui"
import { useEffect } from "react"

type ExpansionState = {
	isExpanded?: boolean
}

const toggleExpansion: signal.ComponentSignalDescriptor<ExpansionState> = {
	dispatcher: (state) => {
		// eslint-disable-next-line no-unneeded-ternary
		state.isExpanded === !state.isExpanded
	},
}

const setExpand: signal.ComponentSignalDescriptor<ExpansionState> = {
	dispatcher: (state) => {
		state.isExpanded = true
	},
}

const setCollapse: signal.ComponentSignalDescriptor<ExpansionState> = {
	dispatcher: (state) => {
		state.isExpanded = false
	},
}

const useExpansion = (
	id: string
): [boolean | undefined, (isExpanded: boolean) => void] => {
	const [isExpanded, setExpanded] = api.component.useStateSlice<boolean>(
		"expansion",
		id,
		true
	)

	useEffect(() => {
		if (isExpanded === undefined) {
			setExpanded(true)
		}
		// We do NOT want to reset the expansion state whenever isExpanded changes,
		// so we don't want to add isExpanded or setExpanded to the deps array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id])

	return [isExpanded, setExpanded]
}

export { toggleExpansion, setExpand, setCollapse, useExpansion }
