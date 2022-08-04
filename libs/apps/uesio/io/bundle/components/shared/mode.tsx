import { hooks, signal, context, definition, state } from "@uesio/ui"

const MODE_SLICE = "mode"
type State = { mode: "READ" | "EDIT" }
const toggleMode: signal.ComponentSignalDescriptor<State> = {
	dispatcher: ({ state, setState }) => {
		setState({
			...state,
			[MODE_SLICE]: state && state.mode === "EDIT" ? "READ" : "EDIT",
		})
	},
	label: "Toggle Mode",
	properties: () => [],
}
const setReadMode: signal.ComponentSignalDescriptor<State> = {
	dispatcher: ({ setState }) => {
		setState({ ...state, [MODE_SLICE]: "READ" })
	},
	label: "Toggle Mode",
	properties: () => [],
}
const setEditMode: signal.ComponentSignalDescriptor<State> = {
	dispatcher: ({ setState }) => {
		setState({ [MODE_SLICE]: "EDIT" })
	},
	label: "Toggle Mode",
	properties: () => [],
}

const useMode = (
	id: string | undefined,
	initialMode: context.FieldMode | undefined,
	props: definition.BaseProps
) => {
	const uesio = hooks.useUesio(props)
	return uesio.component.useState<context.FieldMode>(
		id || props.path || "",
		initialMode || "READ",
		MODE_SLICE
	)
}

export { toggleMode, useMode, setEditMode, setReadMode }
