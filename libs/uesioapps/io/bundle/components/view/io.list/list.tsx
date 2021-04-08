import { hooks, component } from "@uesio/ui"
import { FunctionComponent } from "react"

import { ListProps, ListState } from "./listdefinition"

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

	const [componentState] = uesio.component.useState<ListState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	if (!wire || !componentState) return null

	const data = wire.getData()
	return (
		<>
			{data.map((record) => (
				<component.Slot
					definition={definition}
					listName="components"
					path={path}
					accepts={["uesio.context"]}
					context={newContext.addFrame({
						record: record.getId(),
						fieldMode: componentState.mode,
					})}
				/>
			))}
		</>
	)
}

export default List
