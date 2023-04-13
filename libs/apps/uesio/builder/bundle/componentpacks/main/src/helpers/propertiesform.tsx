import { api, component, context, definition, wire } from "@uesio/ui"
import { get, set, changeKey } from "../api/defapi"
import {
	getAvailableWireIds,
	getFieldMetadata,
	getWireDefinition,
} from "../api/wireapi"
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
import { getComponentDef, setSelectedPath } from "../api/stateapi"
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
			(typeof value === "object" && Object.keys(value).length === 0) ||
			typeof value === "string"
		) {
			return key
		}
		if (wireDef.viewOnly) {
			const viewOnlyField = value as wire.ViewOnlyField
			if (
				viewOnlyField?.type !== "MAP" &&
				viewOnlyField?.type !== "LIST"
			) {
				return key
			}
		}
		return Object.entries(value)
			.map(([key2, value2]) => [`${key}->${key2}`, value2])
			.flatMap(([key, value]) => getFields(key, value))
	}

	return Object.entries(wireDef.fields)
		.flatMap(([key, value]) => getFields(key, value))
		.map((el) => ({ value: el, label: el } as SelectOption))
}

const getWireConditionSelectOptions = (wireDef: wire.WireDefinition) => {
	const conditions: Array<SelectOption> = []

	if (!wireDef || wireDef.viewOnly || !wireDef.conditions) return conditions

	for (const condition of wireDef.conditions) {
		if (!condition) continue

		if (condition?.id) {
			conditions.push({ value: condition.id, label: condition.id })
		}

		if (condition.type === "GROUP" && condition.conditions?.length) {
			for (const subCondition of condition.conditions) {
				if (!subCondition) continue

				if (subCondition?.id) {
					conditions.push({
						value: subCondition.id,
						label: `${condition.id} -> ${subCondition.id}`,
					})
				}
			}
		}
	}
	return conditions
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

const resolveOptions = (
	def: SelectProperty,
	currentValue: wire.PlainWireRecord
): SelectOption[] => {
	const { options } = def
	return typeof options === "function" ? options(currentValue) : options
}

const getSelectListMetadata = (
	def: SelectProperty,
	currentValue: wire.PlainWireRecord
) =>
	getSelectListMetadataFromOptions(
		def.name,
		resolveOptions(def, currentValue).map(
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
	let wireId: string | undefined
	let wireDefinition: wire.WireDefinition | undefined
	switch (type) {
		case "SELECT":
			return getBaseWireFieldDef(def, "SELECT", {
				selectlist: getSelectListMetadata(def, currentValue),
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
			wireId = def.wireField
				? (currentValue[def.wireField] as string)
				: def.wireName
			wireDefinition =
				wireId === undefined
					? undefined
					: getWireDefinition(context, wireId)
			return getBaseWireFieldDef(
				def,
				`${type === "FIELDS" ? "MULTI" : ""}SELECT`,
				{
					selectlist: getSelectListMetadataFromOptions(
						name,
						wireDefinition !== undefined
							? getWireFieldSelectOptions(wireDefinition)
							: [],
						type === "FIELDS" ? undefined : ""
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
		case "TEXT_AREA":
			return getBaseWireFieldDef(def, "LONGTEXT")
		case "NUMBER":
			return getBaseWireFieldDef(def, "NUMBER")
		case "CHECKBOX":
			return getBaseWireFieldDef(def, "CHECKBOX")
		case "CONDITION":
			wireId = def.wireField
				? (currentValue[def.wireField] as string)
				: def.wire
			wireDefinition =
				wireId === undefined
					? undefined
					: getWireDefinition(context, wireId)
			return getBaseWireFieldDef(def, `SELECT`, {
				selectlist: getSelectListMetadataFromOptions(
					name,
					wireDefinition !== undefined
						? getWireConditionSelectOptions(wireDefinition)
						: [],
					""
				),
			})
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

const addToSettersMap = (
	settersMap: Map<string, SetterFunction | SetterFunction[]>,
	key: string,
	setter: SetterFunction
) => {
	const existingSetter = settersMap.get(key)
	if (existingSetter) {
		if (Array.isArray(existingSetter)) {
			existingSetter.push(setter)
		} else {
			settersMap.set(key, [existingSetter, setter])
		}
	} else {
		settersMap.set(key, setter)
	}
}

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
		let setter: SetterFunction = (value: string) =>
			set(context, path.addLocal(name), value)
		let value: wire.FieldValue
		let sourceField: string
		let sourceWire: string
		if (type === "KEY") {
			const [key] = path.pop()
			if (key) {
				value = key
			} else {
				value = get(context, path) as string
			}
			setter = (value: string) => changeKey(context, path, value)
		} else if (type === "WIRE") {
			value = get(context, path.addLocal(name)) as string
			// Special behavior --- if the wire property is set to default to context,
			// and there is no value, then fetch the value from context
			if (!value && property.defaultToContext) {
				value = getClosestWireInContext(context, path)
			}
		} else if (type === "FIELD_METADATA") {
			sourceField =
				(initialValue[property.fieldProperty] as string) ||
				(get(context, path.addLocal(property.fieldProperty)) as string)
			sourceWire = (initialValue[property.wireProperty] ||
				get(context, path.addLocal(property.wireProperty)) ||
				getClosestWireInContext(context, path)) as string
			if (sourceField && sourceWire) {
				// Get the initial value of the corresponding field metadata property
				value = getFieldMetadata(context, sourceWire, sourceField)
					?.source[property.metadataProperty] as string
				// Add a setter to the source field so that whenever it changes, we also update this property
				const metadataSetter = (newFieldId: string) => {
					const newFieldMetadataProperty = getFieldMetadata(
						context,
						sourceWire,
						newFieldId
					)?.source[property.metadataProperty] as string
					if (newFieldMetadataProperty !== undefined) {
						set(
							context,
							path.addLocal(name),
							newFieldMetadataProperty
						)
					}
				}
				addToSettersMap(setters, property.fieldProperty, metadataSetter)
			}
			setter = NoOp
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
			value = get(context, path.addLocal(name)) as string
		}
		addToSettersMap(setters, name, setter)
		initialValue[name] = value
	})

	return {
		setters,
		initialValue: initialValue as wire.PlainWireRecord,
	}
}

// Finds the closest parent node that provides wire or record context,
// and extracts the associated wire property from that node
function getClosestWireInContext(context: context.Context, path: FullPath) {
	let wireId
	let [lastItem, newPath] = path.pop()
	while (lastItem && !wireId) {
		// If the current item looks like a metadata name, try to fetch it as a component type
		if (lastItem && lastItem.includes("/")) {
			const componentDef = getComponentDef(context, lastItem)
			if (componentDef?.slots?.length) {
				let match
				outerLoop: for (const slot of componentDef.slots) {
					if (!slot?.providesContexts) continue
					for (const contextProvision of slot.providesContexts) {
						if (
							contextProvision?.type === "WIRE" ||
							contextProvision?.type === "RECORD"
						) {
							match = contextProvision
							break outerLoop
						}
					}
				}
				if (match && match.wireProperty) {
					wireId = get(
						context,
						newPath.addLocal(lastItem).addLocal(match.wireProperty)
					) as string
				}
			}
		}
		if (newPath) {
			;[lastItem, newPath] = newPath.pop()
		} else {
			break
		}
	}
	return wireId
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
				path={path?.combine()}
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
					const setter = setters.get(field)
					if (setter) {
						Array.isArray(setter)
							? setter.forEach((s) => s(value))
							: setter(value)
					}
				}}
				initialValue={initialValue}
			/>
		</PropertiesWrapper>
	)
}

export default PropertiesForm
