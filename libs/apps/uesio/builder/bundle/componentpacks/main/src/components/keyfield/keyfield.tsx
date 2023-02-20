import { definition, component, metadata, wire } from "@uesio/ui"

type KeyFieldDefinition = {
	fieldId: string
	label?: string
	labelPosition?: string
	wrapperVariant?: metadata.MetadataKey
	textVariant?: metadata.MetadataKey
}

const KeyField: definition.UC<KeyFieldDefinition> = (props) => {
	const {
		context,
		definition: { fieldId, wrapperVariant, textVariant, labelPosition },
	} = props

	const ConstrainedInput = component.getUtility(
		"uesio/builder.constrainedinput"
	)

	const record = context.getRecord()

	if (!record) return null

	const collection = record.getWire().getCollection()
	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const value = record.getFieldValue<string>(fieldId)

	const label = props.definition.label || fieldMetadata.getLabel()

	if (value === undefined) return null

	return (
		<ConstrainedInput
			value={value}
			setValue={(value: wire.FieldValue) =>
				record.update(fieldId, value, context)
			}
			label={label}
			labelPosition={labelPosition}
			context={context}
			fieldWrapperVariant={wrapperVariant}
			textVariant={textVariant}
		/>
	)
}

export default KeyField
