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

	const value = (props.value as Record<string, wire.FieldValue>) || {}
	const mapValue = keys
		? {
				...keys.reduce((obj, key) => ({ ...obj, [key]: null }), {}),
				...value,
		  }
		: value

	const listValue = Object.keys(mapValue).map((key) => ({
		key,
		value: mapValue[key],
	}))

	return (
		<ListField
			fieldId={fieldId}
			path={path}
			value={listValue}
			noAdd={noAdd}
			noDelete={noDelete}
			subType="STRUCT"
			subFields={{
				key: keyField,
				value: valueField,
			}}
			setValue={(value: wire.PlainWireRecord[]) => {
				setValue(
					value.reduce((obj, record) => {
						const key = record.key as string
						const value = record.value as string
						if (value || value === "") {
							obj[key] = value
						}
						return obj
					}, {})
				)
			}}
			mode={mode}
			context={context}
			labelVariant={labelVariant}
			subFieldVariant={subFieldVariant}
		/>
	)
}

export default MapField
