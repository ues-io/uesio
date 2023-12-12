import { signal, context } from "@uesio/ui"

const getRecordId = (
	signal: signal.SignalDefinition,
	context: context.Context
) => {
	const recordId =
		(context.merge(signal.recordId as string) as string) ||
		context.getRecord()?.getIdFieldValue()

	if (!recordId || typeof recordId !== "string") {
		throw new Error("missing record id")
	}
	return recordId
}

const signals: Record<
	string,
	signal.ComponentSignalDescriptor<{
		drawerState: Record<string, boolean>
	}>
> = {
	DRAWER_OPEN: {
		dispatcher: (state, signal, context) => {
			const recordId = getRecordId(signal, context)
			state.drawerState = {
				...state.drawerState,
				[recordId]: true,
			}
		},
	},
	DRAWER_CLOSE: {
		dispatcher: (state, signal, context) => {
			const recordId = getRecordId(signal, context)

			state.drawerState = {
				...state.drawerState,
				[recordId]: false,
			}
		},
	},
	DRAWER_TOGGLE: {
		dispatcher: (state, signal, context) => {
			const recordId = getRecordId(signal, context)

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
