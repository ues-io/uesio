import { hooks, component } from "@uesio/ui"
import { FunctionComponent } from "react"

import { ListProps, ListState } from "./listdefinition"

const List: FunctionComponent<ListProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const defWire = uesio.wire.useWire(definition.wire)
	const wireToUse = defWire || context.getWire()

	// If we got a wire from the definition, add it to context
	const newContext = defWire
		? context.addFrame({
				wire: defWire.getId(),
		  })
		: context

	const [componentState] = uesio.component.useState<ListState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	if (!wireToUse || !componentState) return null

	const data = wireToUse.getData()
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
