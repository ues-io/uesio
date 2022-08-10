import { signal } from "@uesio/ui"
import { FieldState } from "./fielddefinition"

type SetFileSignal = {
	value: string
} & signal.SignalDefinition

const signals: Record<string, signal.ComponentSignalDescriptor<FieldState>> = {
	SAVE_FILE: {
		dispatcher: (state, signal, context, platform) => {
			const blob = new Blob([state.value], { type: state.mimeType })
			const fileName = state.fileName
			const file = new File([blob], fileName, {
				type: state.mimeType,
			})
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
		dispatcher: (state) => {
			state.value = state.originalValue
		},
		label: "Cancel File",
		properties: () => [],
	},
	SET_FILE: {
		dispatcher: (state, signal: SetFileSignal) => {
			state.value = signal.value
		},
		label: "Set File",
		properties: () => [],
	},
	INIT_FILE: {
		dispatcher: (state, signal) => {
			const value = signal.value as string
			return {
				originalValue: value,
				value,
				recordId: signal.recordId as string,
				fieldId: signal.fieldId as string,
				collectionId: signal.collectionId as string,
				fileName: signal.fileName as string,
			}
		},
		label: "Init File",
		properties: () => [],
	},
}

export default signals
