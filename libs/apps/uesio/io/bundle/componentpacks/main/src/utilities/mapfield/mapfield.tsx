import { wire, collection, definition, context, metadata } from "@uesio/ui"
import ListField from "../field/list"

interface MapFieldUtilityProps {
	fieldId: string
	keyField: collection.FieldMetadata
	keys?: string[]
	labelVariant?: metadata.MetadataKey
	mode: context.FieldMode
	noAdd?: boolean
	noDelete?: boolean
	path: string
	setValue: (value: wire.PlainWireRecord) => void
	subFieldVariant?: metadata.MetadataKey
	value: wire.FieldValue
	valueField: collection.FieldMetadata
}

const getStructFieldValuesObject = (
	valueFields: collection.FieldMetadataMap,
	record: wire.PlainWireRecord
) =>
	Object.entries(valueFields).reduce((newStruct, [subFieldId]) => {
		const value = record[subFieldId] as string
		if (value || value === "") {
			newStruct[subFieldId] = value
		}
		return newStruct
	}, {} as Record<string, wire.FieldValue>)

const MapField: definition.UtilityComponent<MapFieldUtilityProps> = (props) => {
	const {
		context,
		fieldId,
		keyField,
		keys,
		labelVariant,
		mode,
		noAdd = false,
		noDelete = false,
		path,
		setValue,
		subFieldVariant,
		valueField,
	} = props

	const internalKey = "__key__"
	const value = (props.value as Record<string, wire.FieldValue>) || {}
	const mapValue = keys
		? {
				...keys.reduce((obj, key) => ({ ...obj, [key]: null }), {}),
				...value,
		  }
		: value

	const getDefaultValue = () => ({
		[internalKey]:
			(keyField?.name || keyField?.label || "item") +
			((keys?.length || 0) + 1),
	})
	// hack the key field provided to give it a different name, so that we can safely isolate the key field from value fields
	const useKeyField = {
		...keyField,
		name: internalKey,
	} as collection.FieldMetadata
	const subFields = {
		[internalKey]: useKeyField,
	} as collection.FieldMetadataMap
	// If our value field is a struct, flatten out all of the subFields into top-level fields, for better UX.
	// We will recombine them in the setValue function into a struct object to be saved.
	const valueFields =
		valueField.type === "STRUCT" ? valueField.subfields : undefined
	if (valueFields) {
		Object.entries(valueFields).forEach(([subFieldId, subField]) => {
			subFields[subFieldId] = subField
		})
	}
	const listValue = Object.entries(mapValue).map(([key, value]) => ({
		[internalKey]: key,
		...(valueFields
			? getStructFieldValuesObject(
					valueFields,
					value as wire.PlainWireRecord
			  )
			: {
					value,
			  }),
	}))

	return (
		<ListField
			fieldId={fieldId}
			path={path}
			value={listValue}
			noAdd={noAdd}
			noDelete={noDelete}
			subType="STRUCT"
			subFields={subFields}
			setValue={(value: wire.PlainWireRecord[]) => {
				setValue(
					value.reduce((obj, record) => {
						const key = record[internalKey] as string
						// If the Sub Type is STRUCT, combine all of the flattened field values back into a STRUCT
						// to save as the Map's value for this key
						if (valueFields) {
							obj[key] = getStructFieldValuesObject(
								valueFields,
								record
							)
						} else {
							// For all other Sub Types, just save the value
							const value = record.value as string
							if (value || value === "") {
								obj[key] = value
							}
						}
						return obj
					}, {})
				)
			}}
			getDefaultValue={getDefaultValue}
			mode={mode}
			context={context}
			labelVariant={labelVariant}
			subFieldVariant={subFieldVariant}
		/>
	)
}

export default MapField
