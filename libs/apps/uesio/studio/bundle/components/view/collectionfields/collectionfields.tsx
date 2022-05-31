import { FunctionComponent } from "react"
import {
	definition,
	wire,
	hooks,
	component,
	collection,
	context,
} from "@uesio/ui"

type CollectionFieldsDefinition = {
	collectionId: string
	namespace: string
}

interface Props extends definition.BaseProps {
	definition: CollectionFieldsDefinition
}

const WIRE_NAME = "collectionFields"

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

const CollectionFields: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionCond = context.merge(definition.collectionId)

	//check this out £
	// const collectionAll = uesio.collection.useCollection(
	// 	context,
	// 	collectionCond
	// )
	// if (!collectionAll) return null

	// const rows = Object.keys(collectionAll?.source.fields).map((key) => {
	// 	const fieldMetadata = collectionAll?.source.fields[key]
	// 	const row = getRowValue(fieldMetadata, context)
	// 	return row
	// })
	// £

	const collection = "uesio/studio.field"
	const fields: wire.WireFieldDefinitionMap = {
		"uesio/studio.name": null,
		"uesio/studio.type": null,
		"uesio/studio.label": null,
		"uesio/studio.collection": null,
		"uesio/studio.languagelabel": null,
	}
	const conditions: wire.WireConditionDefinition[] = [
		{
			field: "uesio/studio.collection",
			value: collectionCond,
			valueSource: "VALUE",
		},
	]

	uesio.wire.useDynamicWire(
		WIRE_NAME,
		{
			collection,
			conditions,
			fields,
			init: {
				query: true,
			},
		},
		true
	)

	return (
		<>
			<component.Component
				componentType="uesio/io.table"
				definition={{
					id: "collectionFieldsTable",
					"uesio.styles": {
						root: {
							padding: "40px",
						},
					},
					wire: WIRE_NAME,
					mode: "EDIT",
					rownumbers: true,
					pagesize: 10,
					rowactions: [
						{
							text: "Delete",
							signals: [
								{
									signal: "wire/TOGGLE_DELETE_STATUS",
								},
							],
						},
					],
					columns: Object.keys(fields).map((record) => ({
						["uesio/io.column"]: {
							field: `${record}`,
						},
					})),
				}}
				path={props.path}
				context={context}
			/>
			{/* <Table
				columns={[
					{ label: "name" },
					{ label: "type" },
					{ label: "label" },
				]}
				rows={rows}
				context={context}
			/> */}
		</>
	)
}

export default CollectionFields
