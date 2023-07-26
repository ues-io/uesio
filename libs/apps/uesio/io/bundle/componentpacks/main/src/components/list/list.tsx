import { api, component, signal, definition, context, wire } from "@uesio/ui"

import { setEditMode, setReadMode, toggleMode } from "../../shared/mode"
import { useEffect, useRef } from "react"

type ListDefinition = {
	id?: string
	wire?: string
	mode?: context.FieldMode
	components?: definition.DefinitionList
	recordDisplay?: component.DisplayCondition[]
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
	const [mode, setMode] = api.component.useMode(
		componentId,
		definition.mode ? definition.mode : context.getFieldMode()
	)
	const initialRender = useRef(true)
	const initialMode = useRef(definition.mode)
	useEffect(() => {
		if (initialRender.current) {
			initialRender.current = false
			return
		}
		if (initialMode) return

		setMode(mode === "READ" ? "EDIT" : "READ")
	}, [context.getFieldMode()])

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
					label="List Components"
				/>
			))}
		</>
	)
}

export type { ListDefinition }

List.signals = signals
export default List
