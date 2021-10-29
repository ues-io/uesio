import { hooks, signal, context, definition } from "@uesio/ui"

const modeDispatcher: signal.ComponentSignalDescriptor = {
	dispatcher: (signal, context, getState, setState) => {
		const mode = getState() as string
		setState(mode === "READ" ? "EDIT" : "READ")
	},
	label: "Toggle Mode",
	properties: () => [],
	slice: "mode",
}

const useMode = (
	id: string,
	initialMode: context.FieldMode,
	props: definition.BaseProps
) => {
	const uesio = hooks.useUesio(props)
	return uesio.component.useState<context.FieldMode>(
		id || props.path || "",
		initialMode || "READ",
		"mode"
	)
}

export { modeDispatcher, useMode }
