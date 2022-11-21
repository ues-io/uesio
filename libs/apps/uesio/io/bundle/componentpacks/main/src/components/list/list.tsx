import { hooks, component } from "@uesio/ui"
import { FunctionComponent } from "react"
import { useMode } from "../../shared/mode"

import { ListProps } from "./listdefinition"

const List: FunctionComponent<ListProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const componentId = uesio.component.getId(definition.id)
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

export default List
