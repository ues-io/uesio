import { FunctionComponent } from "react"
import { definition, component, metadata } from "@uesio/ui"
import MultiMetadataPicker from "../../utility/multimetadatapicker/multimetadatapicker"

type MultiMetadataFieldDefinition = {
	fieldId: string
	metadataType: metadata.MetadataType
	label: string
	grouping?: string
	namespace?: string
}

interface Props extends definition.BaseProps {
	definition: MultiMetadataFieldDefinition
}

const MultiMetadataField: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, label, metadataType },
	} = props

	const record = context.getRecord()
	const wire = context.getWire()

	const grouping = context.merge(props.definition.grouping)
	const namespace = context.merge(props.definition.namespace)

	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)
	if (!fieldMetadata) return null
	const isList = fieldMetadata?.getType() === "LIST"
	if (!isList) return null

	const value = record.getFieldValue<string[]>(fieldId) || []

	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"

	const listprops = {
		...props,
		definition: { ...props.definition, label: "" },
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
			value={value}
			setValue={(nvalue: string[]) => {
				record.update(fieldId, nvalue)
			}}
			context={context}
			grouping={grouping}
			defaultNamespace={namespace}
		/>
	)
}

export default MultiMetadataField
