import { api, component, context, definition, wire } from "@uesio/ui"
import { get, set, changeKey } from "../api/defapi"
import { getAvailableWireIds, getWireDefinition } from "../api/wireapi"
import { FullPath } from "../api/path"
import {
	ComponentProperty,
	getStyleVariantProperty,
	SelectOption,
	SelectProperty,
} from "../properties/componentproperty"
import PropertiesWrapper, {
	Tab,
} from "../components/mainwrapper/propertiespanel/propertieswrapper"
import {
	getSectionIcon,
	getSectionId,
	getSectionLabel,
	PropertiesPanelSection,
} from "../api/propertysection"
import { setSelectedPath } from "../api/stateapi"
import {
	DisplayConditionProperties,
	getDisplayConditionLabel,
} from "../properties/conditionproperties"
import { getSignalProperties } from "../api/signalsapi"
import { useState } from "react"

type Props = {
	properties?: ComponentProperty[]
	content?: definition.DefinitionList
	path: FullPath
	title?: string
	sections?: PropertiesPanelSection[]
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

const getBaseWireFieldDef = (
	ComponentProperty: ComponentProperty,
	type: wire.FieldType,
	additional?: object
) => {
	const { name, label, required } = ComponentProperty
	return {
		label: label || name,
		required: required || false,
		type,
		...additional,
	}
}

const getWireFieldFromPropertyDef = (
	def: ComponentProperty,
	context: context.Context,
	currentValue: wire.PlainWireRecord
): wire.ViewOnlyField => {
	const { name, type } = def
	let wireId: string
	let wireDefinition: wire.WireDefinition | undefined
	switch (type) {
		case "SELECT":
			return getBaseWireFieldDef(def, "SELECT", {
				selectlist: getSelectListMetadata(def),
			})
		case "KEY":
			return getBaseWireFieldDef(def, "TEXT")
		case "WIRE":
		case "WIRES":
			return getBaseWireFieldDef(
				def,
				`${type === "WIRES" ? "MULTI" : ""}SELECT`,
				{
					selectlist: getWireSelectListMetadata(
						context,
						def,
						type === "WIRE"
					),
				}
			)

		case "NAMESPACE":
			return getBaseWireFieldDef(def, "SELECT", {
				selectlist: getNamespaceSelectListMetadata(context, def),
			})
		case "FIELDS":
		case "FIELD":
			wireId = currentValue[def.wireField] as string
			wireDefinition = wireId
				? getWireDefinition(context, wireId)
				: undefined
			return getBaseWireFieldDef(
				def,
				`${type === "FIELDS" ? "MULTI" : ""}SELECT`,
				{
					selectlist: getSelectListMetadataFromOptions(
						name,
						wireDefinition !== undefined
							? getWireFieldSelectOptions(wireDefinition)
							: []
					),
				}
			)
		case "MAP":
		case "PARAMS":
			return getBaseWireFieldDef(def, "MAP")
		case "LIST":
			return getBaseWireFieldDef(def, "LIST")
		case "COMPONENT_ID":
			return getBaseWireFieldDef(def, "TEXT", {
				label: "Component Id",
			})
		case "NUMBER":
			return getBaseWireFieldDef(def, "NUMBER")
		case "CHECKBOX":
			return getBaseWireFieldDef(def, "CHECKBOX")
		default:
			return getBaseWireFieldDef(def, "TEXT")
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

const parseProperties = (
	properties: ComponentProperty[],
	context: context.Context,
	path: FullPath
) => {
	const setters = new Map()
	const initialValue: wire.PlainWireRecord = {} as wire.PlainWireRecord

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

	return {
		setters,
		initialValue: initialValue as wire.PlainWireRecord,
	}
}

function getPropertyTabForSection(section: PropertiesPanelSection): Tab {
	return {
		id: getSectionId(section),
		label: getSectionLabel(section),
		icon: getSectionIcon(section),
	}
}

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const { context, id, path, sections, title } = props

	const [selectedTab, setSelectedTab] = useState<string>(
		sections ? getSectionId(sections[0]) : ""
	)

	let { content, properties } = props

	if (sections && sections.length) {
		const selectedSection =
			sections.find((section) => selectedTab === getSectionId(section)) ||
			sections[0]
		const selectedSectionId = getSectionId(selectedSection)

		switch (selectedSection?.type) {
			case "DISPLAY": {
				properties = [
					{
						name: selectedSectionId,
						type: "LIST",
						items: {
							properties: DisplayConditionProperties,
							displayTemplate: (record: wire.PlainWireRecord) =>
								getDisplayConditionLabel(
									record as component.DisplayCondition
								),
							addLabel: "New Condition",
							title: "Condition Properties",
							defaultDefinition: {
								type: "fieldValue",
								operator: "EQUALS",
							},
						},
					},
				]
				break
			}
			case "STYLES": {
				properties = [
					getStyleVariantProperty(selectedSection.componentType),
				]
				break
			}
			case "SIGNALS": {
				properties = [
					{
						name: selectedSectionId,
						type: "LIST",
						items: {
							properties: (record: wire.PlainWireRecord) =>
								getSignalProperties(record, context),
							displayTemplate: "${signal}",
							addLabel: "New Signal",
							title: "Signal Properties",
							defaultDefinition: {
								signal: "",
							},
						},
					},
				]
				break
			}
			case "CUSTOM":
			case "HOME":
				if (selectedSection?.type === "CUSTOM") {
					content = selectedSection?.viewDefinition
				}
				if (properties && selectedSection?.properties?.length) {
					properties = properties.filter((property) =>
						selectedSection?.properties?.includes(property.name)
					)
				}
				break
		}
	}

	const { setters, initialValue } = parseProperties(
		properties || [],
		context,
		path
	)

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={path}
			title={title}
			onUnselect={() => setSelectedPath(context)}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
			tabs={sections?.map(getPropertyTabForSection)}
		>
			<DynamicForm
				id={id}
				path={path}
				fields={getWireFieldsFromProperties(
					properties,
					context,
					initialValue
				)}
				content={
					content || getFormFieldsFromProperties(properties, path)
				}
				context={context.addComponentFrame(
					"uesio/builder.propertiesform",
					{
						properties,
						path,
					}
				)}
				onUpdate={(field: string, value: string) => {
					setters.get(field)(value)
				}}
				initialValue={initialValue}
			/>
		</PropertiesWrapper>
	)
}

export default PropertiesForm
