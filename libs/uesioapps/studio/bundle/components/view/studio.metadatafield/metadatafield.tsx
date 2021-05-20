import { FunctionComponent } from "react"
import { definition, component, metadata } from "@uesio/ui"
import MetadataPicker from "../../utility/metadatapicker/metadatapicker"

type MetadataFieldDefinition = {
	fieldId: string
	metadataType: metadata.MetadataType
	label: string
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
	const appName = view?.params?.appname

	if (!wire || !record || !workspaceName || !appName) {
		return null
	}

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)
	const value = record.getFieldString(fieldId)

	if (!fieldMetadata) return null

	if (context.getFieldMode() !== "EDIT") {
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
					app: appName,
				},
			})}
		/>
	)
}

export default MetadataField
