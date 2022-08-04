import { hooks, signal, context, definition } from "@uesio/ui"

const MODE_SLICE = "mode"

const toggleMode: signal.ComponentSignalDescriptor<"READ" | "EDIT"> = {
	dispatcher: (signal, context, mode, setState) => {
		setState(mode === "READ" || !mode ? "EDIT" : "READ")
	},
	label: "Toggle Mode",
	properties: () => [],
	slice: MODE_SLICE,
}
const setReadMode: signal.ComponentSignalDescriptor<"READ" | "EDIT"> = {
	dispatcher: (signal, context, mode, setState) => {
		setState("READ")
	},
	label: "Toggle Mode",
	properties: () => [],
	slice: MODE_SLICE,
}
const setEditMode: signal.ComponentSignalDescriptor<"READ" | "EDIT"> = {
	dispatcher: (signal, context, mode, setState) => {
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
