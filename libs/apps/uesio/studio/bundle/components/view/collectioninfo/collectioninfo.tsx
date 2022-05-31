import { FunctionComponent } from "react"
import { definition, hooks, component, collection, context } from "@uesio/ui"

type CollectionInfoDefinition = {
	collectionId: string
	namespace: string
}

interface Props extends definition.BaseProps {
	definition: CollectionInfoDefinition
}

const Table = component.registry.getUtility("uesio/io.table")
const TextField = component.registry.getUtility("uesio/io.textfield")

function getRowValue(
	fieldMetadata: collection.FieldMetadata,
	context: context.Context
) {
	return {
		cells: [
			<TextField
				value={fieldMetadata.name}
				context={context}
				variant="uesio/io.table"
				mode={"READ"}
			/>,
			<TextField
				value={fieldMetadata.type}
				context={context}
				variant="uesio/io.table"
				mode={"READ"}
			/>,
			<TextField
				value={fieldMetadata.label}
				context={context}
				variant="uesio/io.table"
				mode={"READ"}
			/>,
		],
	}
}

const CollectionInfo: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionCond = context.merge(definition.collectionId)
	const collection = uesio.collection.useCollection(context, collectionCond)

	if (!collection) return null

	console.log(collection)

	//TO-DO we can filter by namespace or get rid of the wire version of this in the other component

	const rows = Object.keys(collection?.source.fields).map((key) => {
		const fieldMetadata = collection?.source.fields[key]
		const row = getRowValue(fieldMetadata, context)
		return row
	})

	return (
		<Table
			columns={[{ label: "name" }, { label: "type" }, { label: "label" }]}
			rows={rows}
			context={context}
		/>
	)
}

export default CollectionInfo
