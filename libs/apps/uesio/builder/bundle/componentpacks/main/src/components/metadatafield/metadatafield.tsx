import { definition, component, metadata } from "@uesio/ui"

type MetadataFieldDefinition = {
	fieldId: string
	metadataType: metadata.MetadataType
	label: string
	labelPosition?: string
	grouping?: string
	namespace?: string
	fieldWrapperVariant?: metadata.MetadataKey
}

const MetadataField: definition.UC<MetadataFieldDefinition> = (props) => {
	const MetadataPicker = component.getUtility("uesio/builder.metadatapicker")
	const {
		context,
		definition: {
			fieldId,
			metadataType,
			fieldWrapperVariant,
			labelPosition,
		},
	} = props

	const record = context.getRecord()

	const grouping = context.mergeString(props.definition.grouping)
	const namespace = context.mergeString(props.definition.namespace)

	if (!record) return null

	const collection = record.getWire().getCollection()
	const fieldMetadata = collection.getField(fieldId)
	const value = record.getFieldValue<string>(fieldId)

	if (!fieldMetadata) return null

	const label = props.definition.label || fieldMetadata.getLabel()

	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"

	if (mode !== "EDIT") {
		return <component.Component {...props} componentType="uesio/io.field" />
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={label}
			value={value}
			setValue={(value: string) => {
				record.update(fieldId, value, context)
			}}
			fieldWrapperVariant={fieldWrapperVariant}
			labelPosition={labelPosition}
			context={context}
			{...(grouping && {
				grouping,
			})}
			{...(namespace && {
				defaultNamespace: namespace,
			})}
			variant={props.definition[component.STYLE_VARIANT]}
		/>
	)
}

export default MetadataField
