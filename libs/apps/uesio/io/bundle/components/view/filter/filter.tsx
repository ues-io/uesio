import { FC } from "react"
import getFilterComponentType from "./getfiltercomponenttype"

import { FilterProps } from "./filterdefinition"
import { component, hooks } from "@uesio/ui"

const Filter: FC<FilterProps> = (props) => {
	const { definition, context, path } = props
	const uesio = hooks.useUesio(props)

	if (!definition) return null
	const componentType = getFilterComponentType(
		uesio,
		definition.wire,
		definition.field
	)
	if (!componentType) return null
	return (
		<component.Component
			componentType={componentType}
			definition={definition}
			context={context}
			path={path}
		/>
	)
}

export default Filter
