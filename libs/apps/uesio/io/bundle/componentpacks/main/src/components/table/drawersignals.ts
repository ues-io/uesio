import { signal, context } from "@uesio/ui"

const getRecordId = (
	signal: signal.SignalDefinition,
	context: context.Context
) =>
	context.mergeString(signal.recordId as string) ||
	context.getRecord()?.getId()

const signals: Record<
	string,
	signal.ComponentSignalDescriptor<{
		drawerState: Record<string, boolean>
	}>
> = {
	DRAWER_OPEN: {
		dispatcher: (state, signal, context) => {
			const recordId = getRecordId(signal, context)
			if (!recordId) return
			state.drawerState = {
				...(signal.autoCollapse ? {} : state.drawerState),
				[recordId]: true,
			}
		},
	},
	DRAWER_CLOSE: {
		dispatcher: (state, signal, context) => {
			const recordId = getRecordId(signal, context)
			if (!recordId) return
			state.drawerState = {
				...state.drawerState,
				[recordId]: false,
			}
		},
	},
	DRAWER_TOGGLE: {
		dispatcher: (state, signal, context) => {
			const recordId = getRecordId(signal, context)
			if (!recordId) return
			state.drawerState = {
				...(signal.autoCollapse ? {} : state.drawerState),
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
