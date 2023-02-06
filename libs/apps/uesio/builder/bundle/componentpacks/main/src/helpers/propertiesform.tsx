import { component, definition, wire } from "@uesio/ui"
import { get, set, changeKey } from "../api/defapi"
import { FullPath } from "../api/path"
import {
	ComponentProperty,
	SelectProperty,
	SelectOption,
} from "../api/stateapi"

type Props = {
	properties?: ComponentProperty[]
	content?: definition.DefinitionList
	path: FullPath
}

const getFormFieldFromProperty = (property: ComponentProperty) => {
	switch (property.type) {
		// TODO: ADD support for more advanced builder-specific fields
		// case "METADATA":
		// 	return {
		// 		// TODO: WHY IS THIS COMPONENT NOT AVAILABLE?
		// 		"uesio/studio.metadatafield": {
		// 			fieldId: property.name,
		// 			metadataType: property.metadataType,
		// 			// grouping: property.grouping,
		// 		},
		// 	}
		// case "METADATAMULTI":
		// 	return {
		// 		"uesio/studio.multimetadatafield": {
		// 			fieldId: property.name,
		// 			metadataType: property.metadataType,
		// 			grouping: property.grouping,
		// 		},
		// 	}
		default:
			return {
				"uesio/io.field": {
					"uesio.variant": "uesio/builder.propfield",
					wrapperVariant: "uesio/builder.propfield",
					labelPosition: "left",
					fieldId: property.name,
				},
			}
	}
}

const getFormFieldsFromProperties = (
	properties: ComponentProperty[] | undefined
) => {
	if (!properties) return []
	return properties.map(getFormFieldFromProperty)
}

const getSelectListMetadata = (def: SelectProperty) => ({
	name: `${def.name}_options`,
	blankOptionLabel: def.blankOptionLabel,
	options: def.options.map(
		(o: SelectOption) =>
			({
				...o,
			} as wire.SelectOption)
	),
})

const getWireFieldFromPropertyDef = (
	def: ComponentProperty
): wire.ViewOnlyField => {
	const { name, type, label, required } = def
	switch (type) {
		case "SELECT":
			return {
				label: label || name,
				required: required || false,
				type: "SELECT" as const,
				selectlist: getSelectListMetadata(def),
			}
		case "NUMBER":
			return {
				label: label || name,
				required: required || false,
				type: "NUMBER" as const,
			}
		case "KEY":
			return {
				label: label || name,
				required: true,
				type: "TEXT" as const,
			}
		default:
			return {
				label: label || name,
				required: required || false,
				type: "TEXT" as const,
			}
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

// const getGrouping = (
// 	path: FullPath,
// 	groupingPath?: string,
// 	groupingValue?: string
// ): string | undefined => {
// 	if (groupingValue) return groupingValue
// 	if (!groupingPath) return undefined

// 	const parsePath = component.path.parseRelativePath(
// 		groupingPath,
// 		path.localPath || ""
// 	)

// 	return get(context, path.setLocal(parsePath)) as string
// }

type SetterFunction = (a: string) => void

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const { properties, path, context, id, content } = props

	const setters = new Map()
	const initialValue: wire.PlainWireRecord = {}

	properties?.forEach((property) => {
		const { name, type } = property
		let setter: SetterFunction
		let value: string
		if (type === "KEY") {
			const [key] = path.pop()
			if (key) {
				value = key
			} else {
				value = get(context, path) as string
			}
			setter = (value: string) => changeKey(context, path, value)
		} else {
			setter = (value: string) => set(context, path.addLocal(name), value)
			value = get(context, path.addLocal(name)) as string
		}
		setters.set(name, setter)
		initialValue[name] = value
	})

	return (
		<DynamicForm
			id={id}
			path={path.localPath}
			fields={getWireFieldsFromProperties(properties)}
			content={content || getFormFieldsFromProperties(properties)}
			context={context}
			onUpdate={(field: string, value: string) => {
				setters.get(field)(value)
			}}
			initialValue={initialValue}
		/>
	)
}

export default PropertiesForm
