import { api, signal, context } from "@uesio/ui"

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

const useMode = (id: string, initialMode: context.FieldMode | undefined) =>
	api.component.useStateSlice<context.FieldMode>(
		"mode",
		id,
		initialMode || "READ"
	)

export { toggleMode, useMode, setEditMode, setReadMode }
