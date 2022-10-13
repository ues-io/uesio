import { FC } from "react"
import getFilterComponentType from "./getfiltercomponenttype"

import { FilterProps } from "./filterdefinition"
import { component, hooks } from "@uesio/ui"

const Filter: FC<FilterProps> = (props) => {
	const { definition, context, path = "" } = props
	const uesio = hooks.useUesio(props)

	if (!definition || !definition.wire || !definition.field) return null
	const componentType = getFilterComponentType(
		uesio,
		definition.wire,
		definition.field
	)
	const wire = uesio.wire.useWire(definition.wire)

	if (!componentType || !wire) return null

	return (
		<component.Component<FilterProps>
			componentType={componentType}
			definition={definition}
			context={context}
			path={path}
			wire={wire}
		/>
	)
}

export default Filter
