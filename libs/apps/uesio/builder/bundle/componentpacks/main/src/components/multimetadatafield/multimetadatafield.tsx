import { definition, component, metadata } from "@uesio/ui"

type MultiMetadataFieldDefinition = {
	fieldId: string
	metadataType: metadata.MetadataType
	label: string
	labelPosition?: string
	grouping?: string
	namespace?: string
	fieldWrapperVariant?: metadata.MetadataKey
}

const MultiMetadataField: definition.UC<MultiMetadataFieldDefinition> = (
	props
) => {
	const MultiMetadataPicker = component.getUtility(
		"uesio/builder.multimetadatapicker"
	)
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
	if (!fieldMetadata) throw new Error("Invalid field provided: " + fieldId)
	const label = props.definition.label || fieldMetadata.getLabel()
	const fieldType = fieldMetadata.getType()
	const isList = fieldType === "LIST"
	if (!isList)
		throw new Error("The field provided is not a LIST: " + fieldType)

	const value = record.getFieldValue<string[]>(fieldId) || []

	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"

	const listprops = {
		...props,
		definition: { ...props.definition, label },
		noAdd: true,
	}

	if (mode !== "EDIT") {
		return (
			<component.Component
				{...listprops}
				componentType="uesio/io.field"
			/>
		)
	}

	return (
		<MultiMetadataPicker
			metadataType={metadataType}
			label={label}
			value={value || []}
			setValue={(nvalue: string[]) => {
				record.update(fieldId, nvalue, context)
			}}
			fieldWrapperVariant={fieldWrapperVariant}
			labelPosition={labelPosition}
			context={context}
			grouping={grouping}
			defaultNamespace={namespace}
			variant={props.definition[component.STYLE_VARIANT]}
		/>
	)
}

export default MultiMetadataField
