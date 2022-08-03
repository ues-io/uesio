import { hooks, signal, context, definition } from "@uesio/ui"

const MODE_SLICE = "mode"

const toggleMode: signal.ComponentSignalDescriptor = {
	dispatcher: (signal, context, getters, setState) => {
		const mode = getters.single() as string
		setState(mode === "READ" || !mode ? "EDIT" : "READ")
	},
	label: "Toggle Mode",
	properties: () => [],
	slice: MODE_SLICE,
}
const setReadMode: signal.ComponentSignalDescriptor = {
	dispatcher: (signal, context, getters, setState) => {
		setState("READ")
	},
	label: "Toggle Mode",
	properties: () => [],
	slice: MODE_SLICE,
}
const setEditMode: signal.ComponentSignalDescriptor = {
	dispatcher: (signal, context, getters, setState) => {
		setState("EDIT")
	},
	label: "Toggle Mode",
	properties: () => [],
	slice: MODE_SLICE,
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
