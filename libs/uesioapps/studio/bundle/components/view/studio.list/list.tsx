import { FunctionComponent } from "react"
import { definition, component, metadata } from "@uesio/ui"
import MetadataPicker from "../../utility/studio.metadatapicker/metadatapicker"

//const TitleBar = component.registry.getUtility("io.titlebar")

type ListDefinition = {
	fieldId: string
	label: string
}

interface Props extends definition.BaseProps {
	definition: ListDefinition
}

type Option = {
	value: string
	label: string
}

const List: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, label },
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

	console.log("fieldMetadata", fieldMetadata)

	const value = record.getFieldValue(fieldId)

	if (!fieldMetadata) return null

	if (context.getFieldMode() !== "EDIT") {
		;<div>value</div>
		// return <component.Component {...props} componentType="io.field" />
	}
	console.log("value", value)
	return (
		<h1>value</h1>
		// <MetadataPicker
		// 	metadataType={metadataType}
		// 	label={label}
		// 	value={value}
		// 	setValue={(value: string) => {
		// 		record.update(fieldId, value)
		// 	}}
		// 	context={context.addFrame({
		// 		workspace: {
		// 			name: workspaceName,
		// 			app: appName,
		// 		},
		// 	})}
		// 	{...(grouping && {
		// 		grouping,
		// 	})}
		// 	{...(namespace && {
		// 		defaultNamespace: namespace,
		// 	})}
		// />
	)
}

export default List
