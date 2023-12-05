import { signal } from "@uesio/ui"

const signals: Record<
	string,
	signal.ComponentSignalDescriptor<{
		drawerState: Record<string, boolean>
	}>
> = {
	DRAWER_OPEN: {
		dispatcher: (state, signal, context) => {
			const recordId = context.merge(signal.recordId as string) as string
			if (!recordId) throw new Error("missing record id")

			state.drawerState = {
				...state.drawerState,
				[recordId]: true,
			}
		},
	},
	DRAWER_CLOSE: {
		dispatcher: (state, signal, context) => {
			const recordId = context.merge(signal.recordId as string) as string
			if (!recordId) throw new Error("missing record id")

			state.drawerState = {
				...state.drawerState,
				[recordId]: false,
			}
		},
	},
	DRAWER_TOGGLE: {
		dispatcher: (state, signal, context) => {
			const recordId = context.merge(signal.recordId as string) as string
			if (!recordId) throw new Error("missing record id")

			state.drawerState = {
				...state.drawerState,
				[recordId]: !state.drawerState[recordId],
			}
		},
	},
	DRAWER_CLOSE_ALL: {
		dispatcher: (state) => {
			state.drawerState = {}
		},
	},
}

export default signals
