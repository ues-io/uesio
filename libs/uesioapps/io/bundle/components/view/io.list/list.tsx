import { hooks, component } from "@uesio/ui"
import { FunctionComponent } from "react"

import { ListProps } from "./listdefinition"

const List: FunctionComponent<ListProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	if (!wire) return null

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
					})}
				/>
			))}
		</>
	)
}

export default List
