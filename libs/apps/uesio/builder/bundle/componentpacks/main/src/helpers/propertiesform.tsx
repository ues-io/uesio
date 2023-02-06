import { component, definition, wire } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"
import { ComponentProperty } from "../api/stateapi"

type Props = {
	properties?: ComponentProperty[]
	path: FullPath
}

const getWireFieldFromPropertyDef = (
	def: ComponentProperty
): wire.ViewOnlyField => {
	switch (def.type) {
		case "TEXT":
			return {
				label: def.label || def.name,
				required: false,
				type: "TEXT" as const,
			}

		default:
			throw new Error("Invalid property type: " + def.type)
	}
}

const getWireFieldsFromProperties = (
	properties: ComponentProperty[] | undefined
) => {
	if (!properties) return {}
	return Object.fromEntries(
		properties.map((def) => [def.name, getWireFieldFromPropertyDef(def)])
	)
}

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const { properties, path, context, id } = props

	const initialValue: wire.PlainWireRecord = {}
	properties?.forEach((property) => {
		initialValue[property.name] = get(
			context,
			path.addLocal(property.name)
		) as string
	})

	return (
		<DynamicForm
			id={id}
			path={path.localPath}
			fields={getWireFieldsFromProperties(properties)}
			context={context}
			onUpdate={(field: string, value: string) => {
				set(context, path.addLocal(field), value)
			}}
			currentValue={initialValue}
		/>
	)
}

export default PropertiesForm
