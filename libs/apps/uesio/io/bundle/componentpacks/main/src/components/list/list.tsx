import { hooks, component, signal, definition } from "@uesio/ui"

import {
	setEditMode,
	setReadMode,
	toggleMode,
	useMode,
} from "../../shared/mode"

import { ListProps } from "./listdefinition"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_READ_MODE: setReadMode,
	SET_EDIT_MODE: setEditMode,
}

const List: definition.UesioComponent<ListProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire, context)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const componentId = uesio.component.getComponentIdFromProps(
		definition.id,
		props
	)
	const [mode] = useMode(componentId, definition.mode, props)

	if (!wire || !mode) return null

	return (
		<>
			{wire.getData().map((record, i) => (
				<component.Slot
					key={record.getId() || i}
					definition={definition}
					listName="components"
					path={path}
					accepts={["uesio.standalone", "uesio.field"]}
					context={newContext.addFrame({
						record: record.getId(),
						fieldMode: mode,
					})}
				/>
			))}
		</>
	)
}

List.signals = signals
export default List
