import { builder, component, hooks, definition } from "@uesio/ui"
import getFilterComponentType from "./getfiltercomponenttype"

const PropList = component.getUtility("uesio/builder.proplist")
const FilterProperties: builder.PropComponent<builder.CustomProp> = (props) => {
	const uesio = hooks.useUesio(props)
	const parentPath = component.path.getParentPath(props.path || "")
	const parentDef = props.valueAPI.get(parentPath) as definition.DefinitionMap
	const componentType = getFilterComponentType(
		uesio,
		parentDef.wire as string,
		parentDef.field as string
	)

	if (!componentType) return null
	const properties =
		component.registry.getPropertiesDefinition(componentType).properties

	return (
		<PropList
			{...props}
			propsdef={{}}
			path={component.path.getParentPath(props.path || "")}
			properties={properties}
		/>
	)
}

export default FilterProperties
