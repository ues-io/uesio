import { component, context, definition, wire } from "@uesio/ui"
import { get, set, changeKey } from "../api/defapi"
import { getAvailableWireIds } from "../api/wireapi"
import { FullPath } from "../api/path"
import {
	ComponentProperty,
	SelectProperty,
	SelectOption,
	WireProperty,
} from "../api/stateapi"

type Props = {
	properties?: ComponentProperty[]
	content?: definition.DefinitionList
	path: FullPath
}

const getFormFieldFromProperty = (
	property: ComponentProperty,
	context: context.Context,
	path: FullPath
) => {
	switch (property.type) {
		case "METADATA":
			return {
				"uesio/builder.metadatafield": {
					fieldId: property.name,
					metadataType: property.metadataType,
					fieldWrapperVariant: "uesio/builder.propfield",
					selectVariant: "uesio/builder.propfield",
					labelPosition: "left",
					grouping: getGrouping(
						path,
						context,
						property.groupingPath,
						property.groupingValue
					),
				},
			}
		case "MULTI_METADATA":
			return {
				"uesio/builder.multimetadatafield": {
					fieldId: property.name,
					metadataType: property.metadataType,
					fieldWrapperVariant: "uesio/builder.propfield",
					selectVariant: "uesio/builder.propfield",
					labelPosition: "left",
					grouping: getGrouping(
						path,
						context,
						property.groupingPath,
						property.groupingValue
					),
				},
			}
		case "NUMBER": {
			return {
				"uesio/io.field": {
					"uesio.variant": "uesio/builder.propfield",
					wrapperVariant: "uesio/builder.propfield",
					labelPosition: "left",
					fieldId: property.name,
					number: {
						step: property.step,
						max: property.max,
						min: property.min,
					},
				},
			}
		}
		case "KEYLIST": {
			return {
				"uesio/io.field": {
					fieldId: property.name,
					wrapperVariant: "uesio/io.minimal",
					displayAs: "DECK",
					labelPosition: "none",
					list: {
						components: property.components,
					},
				},
			}
		}
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
	properties: ComponentProperty[] | undefined,
	context: context.Context,
	path: FullPath
) => {
	if (!properties) return []
	return properties.map((prop) =>
		getFormFieldFromProperty(prop, context, path)
	)
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

const getWireSelectListMetadata = (
	context: context.Context,
	def: WireProperty
) => ({
	name: `${def.name}_options`,
	blankOptionLabel: "No Wire selected",
	options: getAvailableWireIds(context).map((wireId) => ({
		value: wireId,
		label: wireId,
	})),
})

const getWireFieldFromPropertyDef = (
	def: ComponentProperty,
	context: context.Context
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
		case "CHECKBOX":
			return {
				label: label || name,
				required: required || false,
				type: "CHECKBOX" as const,
			}
		case "KEY":
			return {
				label: label || name,
				required: true,
				type: "TEXT" as const,
			}
		case "WIRE":
			return {
				label: label || name,
				required: required || false,
				type: "SELECT" as const,
				selectlist: getWireSelectListMetadata(context, def),
			}
		case "KEYLIST":
			return {
				label: label || name,
				required: required || false,
				type: "LIST" as const,
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
	properties: ComponentProperty[] | undefined,
	context: context.Context
) => {
	if (!properties) return {}
	return Object.fromEntries(
		properties.map((def) => [
			def.name,
			getWireFieldFromPropertyDef(def, context),
		])
	)
}

const getGrouping = (
	path: FullPath,
	context: context.Context,
	groupingPath?: string,
	groupingValue?: string
): string | undefined => {
	if (groupingValue) return groupingValue
	if (!groupingPath) return undefined

	const parsePath = component.path.parseRelativePath(
		groupingPath,
		path.localPath || ""
	)

	return get(context, path.setLocal(parsePath)) as string
}

type SetterFunction = (a: string) => void

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const { properties, path, context, id, content } = props

	const setters = new Map()
	const initialValue: wire.PlainWireRecord = {}

	properties?.forEach((property) => {
		const { name, type, defaultValue } = property
		let setter: SetterFunction
		let value
		if (type === "KEY") {
			const [key] = path.pop()
			if (key) {
				value = key
			} else {
				value = get(context, path) as string
			}
			setter = (value: string) => changeKey(context, path, value)
		} else if (type === "KEYLIST") {
			setter = () => {
				/* No setter */
			}
			const nodevalue = get(context, path.addLocal(name)) as Record<
				string,
				wire.PlainWireRecord
			>
			// Add a property called "key" to the value
			value = Object.entries(nodevalue).map(([key, item]) => ({
				...item,
				key,
			}))
		} else {
			setter = (value: string) => set(context, path.addLocal(name), value)
			value = get(context, path.addLocal(name)) as string
		}
		setters.set(name, setter)
		if (value === undefined && defaultValue !== undefined) {
			value = defaultValue
		}
		initialValue[name] = value
	})

	return (
		<DynamicForm
			id={id}
			path={path.localPath}
			fields={getWireFieldsFromProperties(properties, context)}
			content={
				content ||
				getFormFieldsFromProperties(properties, context, path)
			}
			context={context}
			onUpdate={(field: string, value: string) => {
				setters.get(field)(value)
			}}
			initialValue={initialValue}
		/>
	)
}

export default PropertiesForm
