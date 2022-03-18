import { signal } from "@uesio/ui"
import { FieldState } from "./fielddefinition"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	SAVE_FILE: {
		dispatcher: (signal, context, getState, setState, platform) => {
			const state = getState() as FieldState
			const blob = new Blob([state.value], { type: state.mimeType })
			const fileName = state.fileName
			const file = new File([blob], fileName, { type: state.mimeType })
			platform.uploadFile(
				context,
				file,
				state.collectionId,
				state.recordId,
				state.fieldId
			)
		},
		label: "Save File",
		properties: () => [],
	},
	CANCEL_FILE: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as FieldState
			setState({
				...state,
				value: state.originalValue,
			})
		},
		label: "Cancel File",
		properties: () => [],
	},
	SET_FILE: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as FieldState
			setState({
				...state,
				value: signal.value as string,
			})
		},
		label: "Set File",
		properties: () => [],
	},
	INIT_FILE: {
		dispatcher: (signal, context, getState, setState) => {
			const value = signal.value as string
			setState({
				originalValue: value,
				value,
				recordId: signal.recordId as string,
				fieldId: signal.fieldId as string,
				collectionId: signal.collectionId as string,
				fileName: signal.fileName as string,
			})
		},
		label: "Init File",
		properties: () => [],
	},
}

export default signals
