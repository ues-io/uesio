import { wire, collection, definition, context, metadata } from "@uesio/ui"
import ListField from "../field/list"

interface MapFieldUtilityProps {
	mode: context.FieldMode
	value: wire.FieldValue
	setValue: (value: wire.PlainWireRecord) => void
	keyField: collection.FieldMetadata
	valueField: collection.FieldMetadata
	keys?: string[]
	noDelete?: boolean
	subFieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	path: string
	fieldId: string
}

const MapField: definition.UtilityComponent<MapFieldUtilityProps> = (props) => {
	const {
		fieldId,
		mode,
		context,
		keys,
		setValue,
		keyField,
		valueField,
		noDelete,
		subFieldVariant,
		labelVariant,
		path,
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
			noAdd={true}
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
