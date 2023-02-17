import { component, context, definition, wire } from "@uesio/ui"
import { get, set, changeKey } from "../api/defapi"
import { getAvailableWireIds, getWireDefinition } from "../api/wireapi"
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

const getWireFieldSelectOptions = (wireDef: wire.WireDefinition) => {
	if (!wireDef || !wireDef.fields) return [] as SelectOption[]

	const getFields = (
		key: string,
		value: wire.ViewOnlyField | wire.WireFieldDefinition
	): string | string[] => {
		if (!value) return key
		return Object.entries(value)
			.map(([key2, value2]) => [`${key}->${key2}`, value2])
			.flatMap(([key, value]) => getFields(key, value))
	}

	return Object.entries(wireDef.fields)
		.flatMap(([key, value]) => getFields(key, value))
		.map((el) => ({ value: el, label: el } as SelectOption))
}

const getFormFieldFromProperty = (
	property: ComponentProperty,
	context: context.Context,
	path: FullPath
) => {
	const { name, type, displayConditions } = property
	const baseFieldDef = {
		fieldId: name,
		"uesio.variant": "uesio/builder.propfield",
		"uesio.display": displayConditions,
		labelPosition: "left",
	}
	switch (type) {
		case "METADATA":
		case "MULTI_METADATA":
			return {
				[`uesio/builder.${
					type === "METADATA" ? "" : "multi"
				}metadatafield`]: {
					...baseFieldDef,
					metadataType: property.metadataType,
					fieldWrapperVariant: "uesio/builder.propfield",
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
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
					number: {
						step: property.step,
						max: property.max,
						min: property.min,
					},
				},
			}
		}
		case "MAP": {
			return {
				"uesio/io.field": {
					fieldId: property.name,
					wrapperVariant: "uesio/io.minimal",
					displayAs: "DECK",
					labelPosition: "none",
					map: {
						components: property.components,
					},
				},
			}
		}
		case "COMPONENT_ID":
		case "KEY": {
			return {
				"uesio/builder.keyfield": {
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
				},
			}
		}
		case "FIELDS": {
			return {
				"uesio/io.field": {
					...baseFieldDef,
					displayAs: "SELECT",
					wrapperVariant: "uesio/builder.propfield",
				},
			}
		}
		default:
			return {
				"uesio/io.field": {
					...baseFieldDef,
					wrapperVariant: "uesio/builder.propfield",
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

const getSelectListMetadataFromOptions = (
	propertyName: string,
	options: SelectOption[],
	blankOptionLabel?: string
) =>
	({
		name: `${propertyName}_options`,
		blank_option_label: blankOptionLabel,
		options,
	} as wire.SelectListMetadata)

const getSelectListMetadata = (def: SelectProperty) =>
	getSelectListMetadataFromOptions(
		def.name,
		def.options.map(
			(o: SelectOption) =>
				({
					...o,
				} as wire.SelectOption)
		),
		def.blankOptionLabel
	)

const getWireSelectListMetadata = (
	context: context.Context,
	def: WireProperty
) =>
	getSelectListMetadataFromOptions(
		def.name,
		getAvailableWireIds(context).map(
			(wireId) =>
				({
					value: wireId,
					label: wireId,
				} as wire.SelectOption)
		),
		"No wire selected"
	)

const getWireFieldFromPropertyDef = (
	def: ComponentProperty,
	context: context.Context,
	currentValue: wire.PlainWireRecord
): wire.ViewOnlyField => {
	const { name, type, label, required } = def
	let wireId: string
	let wireDefinition: wire.WireDefinition | undefined
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
		case "FIELDS":
			wireId = currentValue[def.wireField] as string
			wireDefinition = wireId
				? getWireDefinition(context, wireId)
				: undefined
			return {
				label: label || name,
				required: required || false,
				type: "MULTISELECT" as const,
				selectlist: getSelectListMetadataFromOptions(
					name,
					wireDefinition !== undefined
						? getWireFieldSelectOptions(wireDefinition)
						: []
				),
			}
		case "MAP":
			return {
				label: label || name,
				required: required || false,
				type: "MAP" as const,
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
	context: context.Context,
	initialValue: wire.PlainWireRecord
) => {
	if (!properties) return {}
	return Object.fromEntries(
		properties.map((def) => [
			def.name,
			getWireFieldFromPropertyDef(def, context, initialValue),
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

type SetterFunction = (a: wire.FieldValue) => void

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const { properties, path, context, id, content } = props

	const setters = new Map()
	const initialValue: wire.PlainWireRecord = {}

	properties?.forEach((property) => {
		const { name, type } = property
		let setter: SetterFunction
		let value: wire.FieldValue
		if (type === "KEY") {
			const [key] = path.pop()
			if (key) {
				value = key
			} else {
				value = get(context, path) as string
			}
			setter = (value: string) => changeKey(context, path, value)
		} else if (type === "MAP") {
			setter = () => {
				/* No setter */
			}
			value = get(context, path.addLocal(name)) as Record<
				string,
				wire.PlainWireRecord
			>
		} else if (type === "FIELDS") {
			setter = (value: Record<string, boolean>) =>
				set(context, path.addLocal(name), Object.keys(value))
			value = get(context, path.addLocal(name)) as string[]
			if (value !== undefined) {
				value = (value as string[]).reduce(
					(acc, curr) => ({
						...acc,
						[curr]: true,
					}),
					{}
				)
			}
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
			fields={getWireFieldsFromProperties(
				properties,
				context,
				initialValue
			)}
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
