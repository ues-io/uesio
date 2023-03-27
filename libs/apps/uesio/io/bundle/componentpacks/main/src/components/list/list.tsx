import { api, component, signal, definition, context } from "@uesio/ui"

import { setEditMode, setReadMode, toggleMode } from "../../shared/mode"

type ListDefinition = {
	id?: string
	wire?: string
	mode?: context.FieldMode
	components?: definition.DefinitionList
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_READ_MODE: setReadMode,
	SET_EDIT_MODE: setEditMode,
}

const List: definition.UC<ListDefinition> = (props) => {
	const { path, context, definition } = props
	const wire = api.wire.useWire(definition.wire, context)

	const componentId = api.component.getComponentIdFromProps(props)
	const [mode] = api.component.useMode(componentId, definition.mode)

	if (!wire || !mode) return null

	return (
		<>
			{wire.getData().map((record, i) => (
				<component.Slot
					key={record.getId() || i}
					definition={definition}
					listName="components"
					path={path}
					context={context
						.addRecordFrame({
							wire: wire.getId(),
							record: record.getId(),
							view: wire.getViewId(),
						})
						.addFieldModeFrame(mode)}
				/>
			))}
		</>
	)
}

export type { ListDefinition }

List.signals = signals
export default List
