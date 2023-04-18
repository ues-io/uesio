import { FunctionComponent } from "react"
import { wire, collection, definition, context, metadata } from "@uesio/ui"
import ListField from "../field/list"

interface MapFieldUtilityProps extends definition.UtilityProps {
	mode: context.FieldMode
	value: wire.FieldValue
	setValue: (value: wire.PlainWireRecord) => void
	keyField: collection.FieldMetadata
	valueField: collection.FieldMetadata
	keys?: string[]
	autoAdd?: boolean
	noAdd?: boolean
	noDelete?: boolean
	fieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	path: string
	fieldId: string
}

const MapField: FunctionComponent<MapFieldUtilityProps> = (props) => {
	const {
		fieldId,
		mode,
		context,
		keys,
		setValue,
		keyField,
		valueField,
		autoAdd,
		noAdd,
		noDelete,
		fieldVariant,
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
			autoAdd={autoAdd}
			noAdd={noAdd}
			noDelete={noDelete}
			subType="MAP"
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
			fieldVariant={fieldVariant}
		/>
	)
}

export default MapField
