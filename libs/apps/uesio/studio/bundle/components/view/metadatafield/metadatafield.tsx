import { FunctionComponent } from "react"
import { definition, component, metadata } from "@uesio/ui"
import MetadataPicker from "../../utility/metadatapicker/metadatapicker"

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
	const {
		context,
		definition: { fieldId, label, metadataType },
	} = props

	const record = context.getRecord()
	const wire = context.getWire()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appId = view?.params?.app

	const grouping = context.merge(props.definition.grouping)
	const namespace = context.merge(props.definition.namespace)

	if (!wire || !record || !workspaceName || !appId) {
		return null
	}

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)
	const value = record.getFieldValue<string>(fieldId)

	if (!fieldMetadata) return null

	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"

	if (mode !== "EDIT") {
		return <component.Component {...props} componentType="io.field" />
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={label}
			value={value}
			setValue={(value: string) => {
				record.update(fieldId, value)
			}}
			context={context.addFrame({
				workspace: {
					name: workspaceName,
					app: appId,
				},
			})}
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
