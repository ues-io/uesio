import {
	api,
	collection,
	component,
	context,
	definition,
	wire,
} from "@uesio/ui"
import { get as getDef, set as setDef, changeKey } from "../api/defapi"
import set from "lodash/set"
import get from "lodash/get"
import { useState } from "react"
import type { PropertyPath } from "lodash"
import {
	getAvailableWireIds,
	getFieldMetadata,
	getWireDefinition,
} from "../api/wireapi"
import { FullPath } from "../api/path"
import {
	ComponentProperty,
	getStyleVariantProperty,
	ListProperty,
	PropertyOnChange,
	SelectProperty,
	StructProperty,
} from "../properties/componentproperty"
import PropertiesWrapper, {
	Tab,
} from "../components/mainwrapper/propertiespanel/propertieswrapper"
import {
	CustomSection,
	getSectionIcon,
	getSectionId,
	getSectionLabel,
	HomeSection,
	PropertiesPanelSection,
} from "../api/propertysection"
import { getComponentDef, setSelectedPath } from "../api/stateapi"
import { getDisplaySectionProperties } from "../properties/displayconditionproperties"
import { getSignalProperties } from "../api/signalsapi"
import { getGrouping } from "../components/property/property"

type Props = {
	properties?: ComponentProperty[]
	content?: definition.DefinitionList
	path: FullPath
	title?: string
	sections?: PropertiesPanelSection[]
}

const PATH_ARROW = "->"
const LODASH_PATH_SEPARATOR = "."

const getWireFieldSelectOptions = (wireDef?: wire.WireDefinition) => {
	if (!wireDef || !wireDef.fields) return [] as wire.SelectOption[]
	const { fields, viewOnly } = wireDef
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
		if (viewOnly) {
			const viewOnlyField = value as wire.ViewOnlyField
			if (
				viewOnlyField?.type !== "MAP" &&
				viewOnlyField?.type !== "LIST" &&
				viewOnlyField?.type !== "STRUCT"
			) {
				return key
			}
		}

		// Recursively find all nested fields, which will be within "fields" property,
		// in addition to any other top level fields on the object
		if (typeof value?.fields === "object") {
			return [key].concat(recursivelyGetFields(key, value.fields))
		}
		return key
	}
	const recursivelyGetFields = (
		key: string,
		value: Record<string, wire.ViewOnlyField> | wire.WireFieldDefinitionMap
	) =>
		Object.entries(value)
			.map(([key2, value2]) => [`${key}${PATH_ARROW}${key2}`, value2])
			.flatMap(([key, value]) =>
				getFields(
					key as string,
					value as wire.ViewOnlyField | wire.WireFieldDefinition
				)
			)

	return Object.entries(fields)
		.flatMap(([key, value]) => getFields(key, value))
		.map((el) => ({ value: el, label: el } as wire.SelectOption))
}

const getWireConditionSelectOptions = (wireDef: wire.WireDefinition) => {
	const conditions: wire.SelectOption[] = []

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
						label: `${condition.id} ${PATH_ARROW} ${subCondition.id}`,
					})
				}
			}
		}
	}
	return conditions
}

// lightweight wrapper around lodash get which uses simple object property retrieval
// if there's no nested property syntax (i.e. "foo->bar" will use lodash get with "foo.bar")
const getObjectProperty = (
	object: wire.PlainWireRecord,
	property: string
): wire.PlainFieldValue => {
	if (property.includes(PATH_ARROW)) {
		return get(
			object,
			property.replace(PATH_ARROW, LODASH_PATH_SEPARATOR)
		) as wire.PlainFieldValue
	} else {
		return object[property] as wire.PlainFieldValue
	}
}

const getFormFieldsFromProperties = (
	properties: ComponentProperty[] = [],
	path: FullPath
) =>
	properties.map((property) => ({
		"uesio/builder.property": {
			property,
			path,
		},
	}))

const getSelectListMetadataFromOptions = (
	propertyName: string,
	options: wire.SelectOption[],
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
): wire.SelectOption[] => {
	const { options = [] } = def
	return typeof options === "function" ? options(currentValue) : options
}

const getSelectListMetadata = (
	def: SelectProperty,
	currentValue: wire.PlainWireRecord
) =>
	def.selectList
		? {
				name: def.selectList,
		  }
		: getSelectListMetadataFromOptions(
				def.name,
				resolveOptions(def, currentValue).map(
					(o: wire.SelectOption) =>
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
		"(Select a namespace)"
	)
}

const getBaseWireFieldDef = (
	ComponentProperty: ComponentProperty,
	type: wire.FieldType,
	additional?: object
): wire.ViewOnlyField => {
	const { name, label, required } = ComponentProperty
	return {
		label: label || name,
		required: required || false,
		type,
		...additional,
	}
}

const getParamsSelectListMetadata = (
	context: context.Context,
	def: ComponentProperty
): wire.SelectListMetadata =>
	getSelectListMetadataFromOptions(
		def.name,
		Object.keys(context.getViewDef()?.params || {}).map((option) => ({
			value: option,
			label: option,
		})),
		"(Select a parameter)"
	)

const getWireFieldFromPropertyDef = (
	def: ComponentProperty,
	context: context.Context,
	currentValue: wire.PlainWireRecord,
	path: FullPath
): wire.ViewOnlyField => {
	const { name, type } = def
	let wireId: string | undefined
	let wireDefinition: wire.WireDefinition | undefined
	let wireField
	let fieldMetadata: collection.Field | undefined
	let fieldMetadataType: wire.FieldType

	switch (type) {
		case "SELECT":
			return getBaseWireFieldDef(def, "SELECT", {
				selectlist: getSelectListMetadata(def, currentValue),
			})
		case "PARAM":
			return getBaseWireFieldDef(def, "SELECT", {
				selectlist: getParamsSelectListMetadata(context, def),
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
			if (def.wireField) {
				wireId = getObjectProperty(
					currentValue,
					def.wireField
				) as string
			} else if (def.wireName) {
				wireId = def.wireName
			} else if (def.wirePath) {
				wireId = getGrouping(path, context, def.wirePath)
			}
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
						getWireFieldSelectOptions(wireDefinition),
						type === "FIELDS" ? undefined : ""
					),
				}
			)
		case "FIELD_VALUE":
		case "FIELD_VALUES":
			wireId = def.wireProperty
				? (getObjectProperty(currentValue, def.wireProperty) as string)
				: getGrouping(path, context, def.wirePath)

			wireField =
				def.fieldProperty &&
				(getObjectProperty(currentValue, def.fieldProperty) as string)

			fieldMetadata = getFieldMetadata(
				context,
				wireId || "",
				wireField || ""
			)
			fieldMetadataType = fieldMetadata?.getType() || "TEXT"
			return getBaseWireFieldDef(
				def,
				type === "FIELD_VALUES" ? "LIST" : fieldMetadataType,
				{
					selectlist: fieldMetadata?.getSelectMetadata(context),
					subtype:
						type === "FIELD_VALUES" ? fieldMetadataType : undefined,
				}
			)
		case "MAP":
		case "PARAMS":
			return getBaseWireFieldDef(def, "MAP")
		case "STRUCT":
			wireField = getBaseWireFieldDef(def, "STRUCT")
			// Process each subField of STRUCT fields as separate subfield
			wireField.fields = {}
			getWireFieldsFromProperties(
				def.properties,
				context,
				(currentValue || {}) as wire.PlainWireRecord,
				wireField.fields,
				path
			)
			return wireField
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
		case "DATE":
			return getBaseWireFieldDef(def, "DATE")
		case "CONDITION":
			wireId = def.wireField
				? (getObjectProperty(currentValue, def.wireField) as string)
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
		case "COLLECTION_FIELDS":
			return getBaseWireFieldDef(def, "LIST", {
				subtype: "TEXT",
			})
		case "METADATA":
		case "MULTIMETADATA":
			return getBaseWireFieldDef(def, type, {
				metadata: {
					type: def.metadataType,
					// grouping will be merged in at render time
					// into the uesio/io.field layout component property
				},
			})
		default:
			return getBaseWireFieldDef(def, "TEXT")
	}
}

const getPropertyId = (property: ComponentProperty) =>
	`${
		property.type === "COMPONENT_ID"
			? component.COMPONENT_ID
			: property.name
	}`

const getWireFieldsFromProperties = (
	properties: ComponentProperty[] | undefined,
	context: context.Context,
	initialValue: wire.PlainWireRecord = {},
	wireFields: Record<string, wire.ViewOnlyField> = {},
	path: FullPath
) => {
	if (!properties || !properties.length) return wireFields
	properties.forEach((def) => {
		wireFields[getPropertyId(def)] = getWireFieldFromPropertyDef(
			def,
			context,
			initialValue,
			path
		)
	})
	return wireFields
}

type SetterFunction = (
	value: wire.FieldValue,
	field: string | undefined,
	record: wire.WireRecord
) => void

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

const getPropPathFromName = (
	name: string,
	path: FullPath
): [FullPath, string[], boolean] => {
	const nameParts = name.split(PATH_ARROW)
	const isNestedProperty = nameParts.length > 1
	const propPath = nameParts.reduce(
		(newPath, part) => newPath.addLocal(part),
		path
	) as FullPath
	return [propPath, nameParts, isNestedProperty]
}

const parseProperties = (
	properties: ComponentProperty[],
	context: context.Context,
	path: FullPath,
	setters: Map<string, SetterFunction | SetterFunction[]> = new Map(),
	initialValue: wire.PlainWireRecord = {} as wire.PlainWireRecord,
	onChangeHandlers: Record<string, PropertyOnChange[]> = {}
) => {
	properties?.forEach((property) => {
		const { onChange, type, viewOnly } = property
		const name = getPropertyId(property)
		const [propPath, nameParts, isNestedProperty] = getPropPathFromName(
			name,
			path
		)
		if (onChange?.length) {
			onChangeHandlers[name] = onChange
		}
		let setter: SetterFunction = (value: wire.PlainFieldValue) => {
			if (viewOnly) {
				return
			}
			// We need to construct the wrapper
			if (isNestedProperty) {
				// e.g. "foo->bar" becomes ["foo", "bar"]
				const [firstPart, ...rest] = nameParts
				const wrapperPath = path.addLocal(firstPart)
				// e.g. get the current value of "foo", if any
				let wrapperValue = getDef(
					context,
					wrapperPath
				) as wire.PlainWireRecord
				// If wrapper value is not an object, it's corrupted
				if (typeof wrapperValue !== "object") {
					wrapperValue = {} as wire.PlainWireRecord
				} else {
					wrapperValue = structuredClone(
						wrapperValue
					) as wire.PlainWireRecord
				}
				// Populate the JSON representation with the new value first,
				// e.g. foo = { "bar": "baz" } ==> { "bar": value }
				set(wrapperValue, rest.join(LODASH_PATH_SEPARATOR), value)

				// Invoke the def api to update YAML with the wrapper value object
				setDef(context, path.addLocal(firstPart), wrapperValue)
			} else {
				// Invoke def api to update YAML
				setDef(context, propPath, value)
			}
		}

		let value: wire.FieldValue
		let sourceField: string
		let sourceWire: string
		if (type === "KEY") {
			const [key] = path.pop()
			if (key) {
				value = key
			} else {
				value = getDef(context, path) as string
			}
			setter = (value: string) => changeKey(context, path, value)
		} else if (type === "WIRE") {
			value = getDef(context, propPath) as string
			// Special behavior --- if the wire property is set to default to context,
			// and there is no value, then fetch the value from context
			if (!value && property.defaultToContext) {
				value = getClosestWireInContext(context, path)
			}
		} else if (type === "FIELD_METADATA") {
			sourceField =
				(getDef(
					context,
					path.addLocal(property.fieldProperty)
				) as string) ||
				(getObjectProperty(
					initialValue,
					property.fieldProperty
				) as string)
			sourceWire = property.wireName as string
			if (!sourceWire && property.wireProperty) {
				sourceWire =
					(getDef(
						context,
						path.addLocal(property.wireProperty)
					) as string) ||
					(getObjectProperty(
						initialValue,
						property.wireProperty
					) as string)
			}
			if (!sourceWire) {
				sourceWire = getClosestWireInContext(context, path) as string
			}
			if (sourceField && sourceWire) {
				// Get the initial value of the corresponding field metadata property
				value = get(
					getFieldMetadata(context, sourceWire, sourceField)?.source,
					property.metadataProperty as PropertyPath
				) as string
				// Add a setter to the source field so that whenever it changes, we also update this property
				const metadataSetter = (
					newFieldId: string,
					_fieldBeingUpdated: string,
					record: wire.WireRecord
				) => {
					const newFieldMetadataProperty = get(
						getFieldMetadata(context, sourceWire, newFieldId)
							?.source,
						property.metadataProperty as PropertyPath
					) as string
					if (newFieldMetadataProperty !== undefined) {
						// Update in-memory representation for this field, since we are computing it here,
						// we need to apply it to the record
						record?.update(name, newFieldMetadataProperty, context)
						if (viewOnly) return
						// Update YAML
						setDef(context, propPath, newFieldMetadataProperty)
					}
				}
				addToSettersMap(setters, property.fieldProperty, metadataSetter)
			}
			setter = NoOp
		} else if (type === "MAP") {
			setter = NoOp
			value = getDef(context, propPath) as Record<
				string,
				wire.PlainWireRecord
			>
		} else if (type === "STRUCT") {
			setter = (value: wire.PlainFieldValue, field: string) => {
				if (viewOnly) return
				let newValue: wire.PlainFieldValue | wire.PlainWireRecord =
					undefined
				// If a specific field was not provided,
				// then we assume we were given the entire struct as our value
				if (!field && typeof value === "object") {
					newValue = value
				} else if (field) {
					// If a specific field was provided, we need to first get our value
					// and then update just a particular field on it
					const currentValue = (getDef(context, propPath) ||
						{}) as Record<string, wire.PlainWireRecord>
					newValue = {
						...currentValue,
					} as wire.PlainWireRecord
					set(
						newValue,
						field.replace(PATH_ARROW, LODASH_PATH_SEPARATOR),
						value
					)
				}
				// Update YAML definition
				setDef(context, propPath, newValue)
			}
			value = getDef(context, propPath) as Record<
				string,
				wire.PlainWireRecord
			>
		} else if (type === "LIST" || type === "SIGNALS") {
			setter = NoOp
			value = getDef(context, propPath) as wire.PlainWireRecord[]
			if (type === "SIGNALS") {
				// Mutate the property into a LIST type
				const listProperty = property as unknown as ListProperty
				listProperty.items = {
					properties: (
						record: wire.PlainWireRecord,
						context: context.Context
					) => getSignalProperties(record, context),
					displayTemplate: "${signal}",
					addLabel: "New Signal",
					title: "Signal Properties",
					defaultDefinition: {
						signal: "",
					},
				}
				// TODO: Add an "onerror" property category as well
				listProperty.type = "LIST"
			}
		} else if (type === "FIELDS" || type === "WIRES") {
			// Values are stored as a list in the YAML,
			// but we are rendering these using the Multiselect control,
			// which works with a Record<string, boolean> where the keys are values which
			// should be present in the YAML list
			setter = (value: Record<string, boolean>) =>
				!viewOnly &&
				setDef(
					context,
					propPath,
					// If we get a null value, swap it to undefined,
					// which will result in the property being removed from the YAML
					value === null ? undefined : Object.keys(value)
				)
			value = getDef(context, propPath) as string[]
			if (value !== undefined) {
				value = ((value || []) as string[]).reduce(
					(acc, curr) => ({
						...acc,
						[curr]: true,
					}),
					{}
				)
			}
		} else {
			value = getDef(context, propPath) as string
		}
		addToSettersMap(setters, name, setter)
		if (value !== undefined) {
			set(
				initialValue,
				[name.replace(PATH_ARROW, LODASH_PATH_SEPARATOR)],
				value
			)
		}
	})

	return {
		setters,
		initialValue: initialValue as wire.PlainWireRecord,
		onChangeHandlers,
	}
}

// Finds the closest parent node that provides wire or record context,
// and extracts the associated wire property from that node
function getClosestWireInContext(context: context.Context, path: FullPath) {
	let wireId
	let [lastItem, newPath] = path.pop()
	while (lastItem && !wireId) {
		// If the current item looks like a metadata name, try to fetch it as a component type
		if (lastItem?.includes("/")) {
			const componentDef = getComponentDef(lastItem)
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
				if (match?.wireProperty) {
					wireId = getDef(
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

const findProperty = (
	propertyNameParts: string[],
	properties: ComponentProperty[]
): ComponentProperty | undefined => {
	const propertyName = propertyNameParts.shift()
	if (propertyNameParts.length === 0) {
		return properties.find((p) => p.name === propertyName)
	} else {
		// Find a property of type STRUCT whose name matches the first part of the property name
		const structProperty = properties.find(
			(p) => p.name === propertyName && p.type === "STRUCT"
		)
		if (!structProperty) return undefined
		return findProperty(
			propertyNameParts,
			(structProperty as StructProperty).properties
		)
	}
}

const getProperty = (
	propertyId: string,
	properties: ComponentProperty[]
): ComponentProperty | undefined => {
	const nameParts = propertyId.split(PATH_ARROW)
	const isNestedProperty = nameParts.length > 1
	const propertyMatch = findProperty(nameParts, properties)
	if (propertyMatch && isNestedProperty) {
		// If this is a nested field, then we need to use the fully-qualified field name for the property name,
		// but if not, we can just use the original property object
		return {
			...propertyMatch,
			name: propertyId,
		} as ComponentProperty
	}
	return propertyMatch
}

function getPropertiesForSection(
	section: CustomSection | HomeSection,
	properties: ComponentProperty[]
): ComponentProperty[] {
	if (section.properties?.length) {
		const matchingProperties = []
		for (const propertyId of section.properties) {
			const propertyMatch = getProperty(propertyId, properties)
			if (propertyMatch) {
				matchingProperties.push(propertyMatch)
			}
		}
		return matchingProperties
	} else {
		return properties
	}
}

const getPropertiesAndContent = (props: Props, selectedTab: string) => {
	let { content, properties } = props
	const { path, sections } = props

	if (sections && sections.length) {
		const selectedSection =
			sections.find((section) => selectedTab === getSectionId(section)) ||
			sections[0]
		const selectedSectionId = getSectionId(selectedSection)

		switch (selectedSection?.type) {
			case "DISPLAY": {
				properties = getDisplaySectionProperties(selectedSectionId)
				break
			}
			case "STYLES": {
				properties = [
					getStyleVariantProperty(selectedSection.componentType),
				]
				content = [
					{
						"uesio/builder.property": {
							property: properties[0],
							path,
						},
					},
					{
						"uesio/builder.stylesproperty": {
							componentType: selectedSection.componentType,
							componentPath: path,
						},
					},
				]
				break
			}
			case "SIGNALS": {
				properties = [
					{
						name: selectedSectionId,
						type: "SIGNALS",
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
					properties = getPropertiesForSection(
						selectedSection,
						properties
					)
				}
				break
		}
	}

	return {
		content,
		properties,
	}
}

const onUpdate = (
	field: string,
	value: wire.FieldValue,
	record: wire.WireRecord,
	context: context.Context,
	path: FullPath,
	setters: Map<string, SetterFunction | SetterFunction[]>,
	onChangeHandlers: Record<string, PropertyOnChange[]>
) => {
	let setter = setters.get(field)
	let setterField: string | undefined
	// If there is no setter, and the field is nested, then walk up the tree
	// to see if there is a setter registered for the parent field
	if (!setter) {
		const fieldParts = field.split(PATH_ARROW)
		if (fieldParts.length > 1) {
			const popped = []
			while (fieldParts.length) {
				popped.push(fieldParts.pop())
				const parentField = fieldParts.join(PATH_ARROW)
				setter = setters.get(parentField)
				if (setter) {
					setterField = popped.join(PATH_ARROW)
					break
				}
			}
		}
	}
	if (setter) {
		Array.isArray(setter)
			? setter.forEach((s) => {
					s(value, setterField, record)
			  })
			: setter(value, setterField, record)
	}
	// Finally, once all setters have run, apply any on-Change handlers
	if (onChangeHandlers[field]?.length) {
		const onChangeHandlerContext = context.addRecordFrame({
			record: record.getId(),
			wire: record.getWire().getId(),
		})
		onChangeHandlers[field].forEach((onChange) => {
			if (
				!onChange.conditions?.length ||
				component.shouldAll(onChange.conditions, onChangeHandlerContext)
			) {
				onChange.updates?.forEach(
					({ field: targetField, value: newValue }) => {
						const [targetPath] = getPropPathFromName(
							targetField,
							path
						)
						setDef(context, targetPath, newValue)
					}
				)
			}
		})
	}
}

const getPropertiesContext = (context: context.Context, wire?: wire.Wire) => {
	if (wire) {
		const record = wire.getFirstRecord()?.getId()
		if (record) {
			return context.addRecordFrame({
				wire: wire.getId(),
				record,
			})
		}
	}
	return context
}

const PropertiesForm: definition.UtilityComponent<Props> = (props) => {
	const DynamicForm = component.getUtility("uesio/io.dynamicform")
	const { path, sections = [], title, id = title } = props

	const [selectedTab, setSelectedTab] = useState<string>(
		sections && sections.length ? getSectionId(sections[0]) : ""
	)
	const { content, properties } = getPropertiesAndContent(props, selectedTab)

	const { setters, initialValue, onChangeHandlers } = parseProperties(
		properties || [],
		props.context,
		path
	)
	const pathString = path?.combine()
	const wire = api.wire.useWire("dynamicwire:" + id, props.context)
	const context = getPropertiesContext(props.context, wire)
	const propSections = component
		.useShouldFilter(sections, context)
		?.map((section) => getPropertyTabForSection(section))

	return (
		<PropertiesWrapper
			context={context}
			className={props.className}
			path={path}
			title={title}
			onUnselect={() => setSelectedPath(context)}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
			tabs={propSections}
		>
			<DynamicForm
				id={id}
				path={pathString}
				fields={getWireFieldsFromProperties(
					properties,
					context,
					initialValue,
					{},
					path
				)}
				content={
					content || getFormFieldsFromProperties(properties, path)
				}
				context={context}
				onUpdate={(
					field: string,
					value: wire.FieldValue,
					record: wire.WireRecord
				) => {
					onUpdate(
						field,
						value,
						record,
						context,
						path,
						setters,
						onChangeHandlers
					)
				}}
				initialValue={initialValue}
			/>
		</PropertiesWrapper>
	)
}

export default PropertiesForm
