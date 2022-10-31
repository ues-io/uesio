import { hooks, signal, context, definition } from "@uesio/ui"
import { useEffect } from "react"

type ModeState = {
	mode?: context.FieldMode
}

const toggleMode: signal.ComponentSignalDescriptor<ModeState> = {
	dispatcher: (state) => {
		state.mode = state.mode === "READ" || !state.mode ? "EDIT" : "READ"
	},
	label: "Toggle Mode",
	properties: () => [],
}
const setReadMode: signal.ComponentSignalDescriptor<ModeState> = {
	dispatcher: (state) => {
		state.mode = "READ"
	},
	label: "Read Mode",
	properties: () => [],
}
const setEditMode: signal.ComponentSignalDescriptor<ModeState> = {
	dispatcher: (state) => {
		state.mode = "EDIT"
	},
	label: "Edit Mode",
	properties: () => [],
}

const useMode = (
	id: string,
	initialMode: context.FieldMode | undefined,
	props: definition.BaseProps
): [context.FieldMode | undefined, (state: context.FieldMode) => void] => {
	const uesio = hooks.useUesio(props)

	const [currentMode, setMode] =
		uesio.component.useStateSlice<context.FieldMode>(
			"mode",
			id,
			initialMode || "READ"
		)

	useEffect(() => {
		if (initialMode) {
			setMode(initialMode)
		}
	}, [initialMode])

	return [currentMode, setMode]
}

export { toggleMode, useMode, setEditMode, setReadMode }
