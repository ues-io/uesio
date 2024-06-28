import { api, component, signal, definition, context } from "@uesio/ui"

import { setEditMode, setReadMode, toggleMode } from "../../shared/mode"

type ItemDefinition = {
	id?: string
	wire?: string
	mode?: context.FieldMode
	components?: definition.DefinitionList
	external?: {
		collection: string
		record: string
	}
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_READ_MODE: setReadMode,
	SET_EDIT_MODE: setEditMode,
}

const Item: definition.UC<ItemDefinition> = (props) => {
	const { path, definition, componentType } = props
	let { context } = props

	const componentId = api.component.getComponentIdFromProps(props)
	const [mode] = api.component.useMode(componentId, definition.mode)

	if (mode) {
		context = context.addFieldModeFrame(mode)
	}

	// If we didn't specify a wire, but we did specify a collection
	// and record, check to see if any wires of that collection are
	// available in the entire context
	if (!definition.wire && definition.external) {
		const external = definition.external
		const record = api.wire.useExternalRecord(
			context.mergeString(external.collection),
			context.mergeString(external.record)
		)
		if (!record) return null
		context = context.addRecordDataFrame(record)
	} else {
		const wire = api.wire.useWire(definition.wire, context)
		if (!wire) return null
		// If there is not a record context frame for this wire, check to see if there is one,
		// because we cannot render the item without at least one wire record.
		// If we don't have a record context frame, explicitly add one using the first wire record.
		if (!context.getRecordFrame(wire.getId())) {
			const record = wire.getFirstRecord()
			if (!record) {
				return null
			}
			context = context.addRecordFrame({
				wire: wire.getId(),
				record: record.getId(),
			})
		}
	}

	return (
		<component.Slot
			definition={definition}
			listName="components"
			path={path}
			context={context}
			componentType={componentType}
		/>
	)
}

export type { ItemDefinition }

Item.signals = signals
export default Item
