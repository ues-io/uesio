import { api, component, signal, definition, context, wire } from "@uesio/ui"

import { setEditMode, setReadMode, toggleMode } from "../../shared/mode"

type ListDefinition = {
	wire?: string
	mode?: context.FieldMode
	components?: definition.DefinitionList
	recordDisplay?: component.DisplayCondition[]
	iterate?: boolean
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_READ_MODE: setReadMode,
	SET_EDIT_MODE: setEditMode,
}

const List: definition.UC<ListDefinition> = (props) => {
	const { path, context, definition, componentType } = props
	const { iterate = true } = definition
	const wire = api.wire.useWire(definition.wire, context)

	const componentId = api.component.getComponentIdFromProps(props)
	const [mode] = api.component.useMode(componentId, definition.mode)

	if (!iterate) {
		if (!wire) return null
		const wireContext = context.addWireFrame({
			wire: wire.getId(),
			view: wire.getViewId(),
		})
		return (
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={
					mode ? wireContext.addFieldModeFrame(mode) : wireContext
				}
				componentType={componentType}
			/>
		)
	}

	const itemContexts = component.useContextFilter<wire.WireRecord>(
		wire?.getData() || [],
		definition.recordDisplay,
		(record, context) => {
			if (record && wire) {
				context = context.addRecordFrame({
					wire: wire.getId(),
					record: record.getId(),
					view: wire.getViewId(),
				})
			}
			if (mode) {
				context = context.addFieldModeFrame(mode)
			}
			return context
		},
		context
	)

	return (
		<>
			{itemContexts.map((recordContext, i) => (
				<component.Slot
					key={recordContext.item.getId() || i}
					definition={definition}
					listName="components"
					path={path}
					context={recordContext.context}
					componentType={componentType}
				/>
			))}
		</>
	)
}

export type { ListDefinition }

List.signals = signals
export default List
