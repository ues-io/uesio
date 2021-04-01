import { hooks, component } from "@uesio/ui"
import { FunctionComponent } from "react"

import { ListProps, ListState } from "./listdefinition"

const List: FunctionComponent<ListProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

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
					context={context.addFrame({
						record: record.getId(),
						wire: wire.getId(),
						fieldMode: componentState.mode,
					})}
				/>
			))}
		</>
	)
}

export default List
