import { api, component, context, definition, wire } from "@uesio/ui"
import { get, set, changeKey } from "../api/defapi"
import { getAvailableWireIds, getWireDefinition } from "../api/wireapi"
import { FullPath } from "../api/path"
import {
	BotProperty,
	ComponentProperty,
	SelectOption,
	SelectProperty,
} from "../properties/componentproperty"

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
		// Sometimes value (the field definition) will be undefined,
		// sometimes it will be an empty object, sometimes it will contain other subfields.
		// If it's either an empty object or undefined, just return the key.
		if (
			!value ||
			(typeof value === "object" && Object.keys(value).length === 0)
		) {
			return key
		}
		return Object.entries(value)
			.map(([key2, value2]) => [`${key}->${key2}`, value2])
			.flatMap(([key, value]) => getFields(key, value))
	}

	return Object.entries(wireDef.fields)
		.flatMap(([key, value]) => getFields(key, value))
		.map((el) => ({ value: el, label: el } as SelectOption))
}

const getFormFieldsFromProperties = (
	properties: ComponentProperty[] | undefined,
	path: FullPath
) => {
	if (!properties) return []
	return properties.map((prop) => ({
		"uesio/builder.property": {
			propertyId: prop.name,
			path,
		},
	}))
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
	def: ComponentProperty,
	addBlankOption?: boolean
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
		addBlankOption ? "No wire selected" : undefined
	)

const getNamespaceSelectListMetadata = (
	context: context.Context,
	def: ComponentProperty
) => {
	const [namespaces] = api.builder.useAvailableNamespaces(context)
	return getSelectListMetadataFromOptions(
		def.name,
		namespaces?.map(
			(ns) =>
				({
					value: ns,
					label: ns,
				} as wire.SelectOption)
		) || [],
		"Select a namespace"
	)
}

const getBotSelectListMetadata = (
	context: context.Context,
	def: BotProperty
) => {
	let { namespace } = def
	if (!namespace && def.name && def.name.includes(".")) {
		namespace = def.name.split(".")[0]
	}

	const [metadata] = api.builder.useMetadataList(
		context,
		"BOT",
		namespace || "",
		def.botType
	)

	return getSelectListMetadataFromOptions(
		def.name,
		Object.keys(metadata || {}).map((key) => {
			const label = key.split(namespace + ".")[1] || key
			return {
				value: key,
				label,
			}
		}),
		"Select Bot"
	)
}

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
		case "BOT":
			return {
				label: label || name,
				type: "SELECT" as const,
				required: false,
				selectlist: getBotSelectListMetadata(context, def),
			}
		case "WIRE":
		case "WIRES":
			return {
				label: label || name,
				required: required || false,
				type: `${type === "WIRES" ? "MULTI" : ""}SELECT` as const,
				selectlist: getWireSelectListMetadata(
					context,
					def,
					type === "WIRE"
				),
			}
		case "NAMESPACE":
			return {
				label: label || name,
				required: required || false,
				type: "SELECT" as const,
				selectlist: getNamespaceSelectListMetadata(context, def),
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
		case "PARAMS":
			return {
				label: label || name,
				required: required || false,
				type: "TEXT" as const,
			}
		case "LIST":
			return {
				label: label || name,
				required: required || false,
				type: "LIST" as const,
			}
		case "COMPONENT_ID":
			return {
				label: "Component Id",
				required: required || false,
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
	properties: ComponentProperty[] | undefined,
	context: context.Context,
	initialValue: wire.PlainWireRecord
) => {
	if (!properties) return {}
	return Object.fromEntries(
		properties.map((def) => [
			def.type === "COMPONENT_ID" ? "uesio.id" : def.name,
			getWireFieldFromPropertyDef(def, context, initialValue),
		])
	)
}

type SetterFunction = (a: wire.FieldValue) => void

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NoOp = function () {}

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const { properties, path, context, id, content } = props

	const setters = new Map()
	const initialValue: wire.PlainWireRecord = {}

	properties?.forEach((property) => {
		const { type } = property
		const name = type === "COMPONENT_ID" ? "uesio.id" : property.name
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
			setter = NoOp
			value = get(context, path.addLocal(name)) as Record<
				string,
				wire.PlainWireRecord
			>
		} else if (type === "LIST") {
			setter = NoOp
			value = get(context, path.addLocal(name)) as wire.PlainWireRecord[]
		} else if (type === "FIELDS" || type === "WIRES") {
			// Values are stored as a list in the YAML,
			// but we are rendering these using the Multiselect control,
			// which works with a Record<string, boolean> where the keys are values which
			// should be present in the YAML list
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
			content={content || getFormFieldsFromProperties(properties, path)}
			context={context.addComponentFrame("uesio/builder.propertiesform", {
				properties,
				path,
			})}
			onUpdate={(field: string, value: string) => {
				setters.get(field)(value)
			}}
			initialValue={initialValue}
		/>
	)
}

export default PropertiesForm
