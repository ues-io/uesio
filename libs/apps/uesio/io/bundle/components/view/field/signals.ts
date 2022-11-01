import { signal } from "@uesio/ui"
import { FieldState } from "./fielddefinition"

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
		properties: [],
	},
	CANCEL_FILE: {
		dispatcher: (state) => {
			state.value = state.originalValue
		},
		label: "Cancel File",
		properties: [],
	},
}

export default signals
