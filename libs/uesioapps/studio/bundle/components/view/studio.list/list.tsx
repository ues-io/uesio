import { FunctionComponent } from "react"
import { definition, component, metadata, wire } from "@uesio/ui"
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
	label: string
	value: string
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

	const VALUE = [
		{
			label: "Male",
			value: "MALE",
		},
		{
			label: "Female",
			value: "FEMALE",
		},
		{
			label: "Other",
			value: "OTHER",
		},
	]

	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)
	//const value = record.getFieldString(fieldId)

	if (!fieldMetadata || !fieldMetadata.source.subfields) return null

	const tableHeader = fieldMetadata.source.subfields

	return (
		<table>
			<tr>
				{tableHeader.map((item) => (
					<th>{item.name}</th>
				))}
			</tr>
			{VALUE.map((item) => (
				<tr>
					<td>{item.label}</td>
					<td>{item.value}</td>
				</tr>
			))}
		</table>
	)
}

export default List
