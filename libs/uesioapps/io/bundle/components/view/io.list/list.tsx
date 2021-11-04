import { hooks, component } from "@uesio/ui"
import { FunctionComponent, useRef } from "react"
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

	const [mode] = useMode(definition.id, definition.mode, props)
	const ref = useRef<HTMLDivElement>(null)

	if (!wire || !mode) return null

	const data = wire.getData()
	return (
		<div ref={ref}>
			{data.map((record) => (
				<component.Slot
					parentRef={ref}
					definition={definition}
					listName="components"
					path={path}
					accepts={["uesio.standalone"]}
					context={newContext.addFrame({
						record: record.getId(),
						fieldMode: mode,
					})}
				/>
			))}
		</div>
	)
}

export default List
