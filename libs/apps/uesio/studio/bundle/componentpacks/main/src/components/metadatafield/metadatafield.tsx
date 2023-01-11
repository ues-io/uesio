import { FunctionComponent } from "react"
import { definition, component, metadata } from "@uesio/ui"

type MetadataFieldDefinition = {
	fieldId: string
	metadataType: metadata.MetadataType
	label: string
	grouping?: string
	namespace?: string
}

interface Props extends definition.BaseProps {
	definition: MetadataFieldDefinition
}

const MetadataField: FunctionComponent<Props> = (props) => {
	const MetadataPicker = component.getUtility("uesio/builder.metadatapicker")
	const {
		context,
		definition: { fieldId, metadataType },
	} = props

	const record = context.getRecord()
	const wire = context.getWire()

	const grouping = context.mergeString(props.definition.grouping)
	const namespace = context.mergeString(props.definition.namespace)

	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
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
				record.update(fieldId, value)
			}}
			context={context}
			{...(grouping && {
				grouping,
			})}
			{...(namespace && {
				defaultNamespace: namespace,
			})}
		/>
	)
}

export default MetadataField
