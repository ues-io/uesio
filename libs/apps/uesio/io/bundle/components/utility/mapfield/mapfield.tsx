import { FunctionComponent } from "react"
import {
	wire,
	collection,
	definition,
	context,
	component,
	metadata,
} from "@uesio/ui"
import { ListFieldUtilityProps } from "../listfield/listfield"

const ListField =
	component.getUtility<ListFieldUtilityProps>("uesio/io.listfield")

interface MapFieldUtilityProps extends definition.UtilityProps {
	mode: context.FieldMode
	value: wire.PlainWireRecord
	setValue: (value: wire.PlainWireRecord) => void
	keyField: collection.FieldMetadata
	valueField: collection.FieldMetadata
	keys?: string[]
	autoAdd?: boolean
	noAdd?: boolean
	fieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
}

const MapField: FunctionComponent<MapFieldUtilityProps> = (props) => {
	const {
		mode,
		context,
		value,
		keys,
		setValue,
		keyField,
		valueField,
		autoAdd,
		noAdd,
		fieldVariant,
		labelVariant,
	} = props

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
			value={listValue}
			autoAdd={autoAdd}
			noAdd={noAdd}
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

export { MapFieldUtilityProps }
export default MapField
