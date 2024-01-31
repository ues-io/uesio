import { definition, component, metadata, wire } from "@uesio/ui"

type KeyFieldDefinition = {
	fieldId: string
	label?: string
	labelPosition?: string
	wrapperVariant?: metadata.MetadataKey
}

const KeyField: definition.UC<KeyFieldDefinition> = (props) => {
	const {
		context,
		definition: { fieldId, wrapperVariant, labelPosition },
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

	const label = props.definition.label || fieldMetadata.getLabel(context)

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
			fieldComponentType="uesio/io.textfield"
			fieldComponentProps={{
				variant: "uesio/io.field:uesio/builder.propfield",
			}}
		/>
	)
}

export default KeyField
