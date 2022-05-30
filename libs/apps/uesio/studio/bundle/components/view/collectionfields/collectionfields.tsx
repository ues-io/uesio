import { FunctionComponent } from "react"
import { definition, wire, hooks, component } from "@uesio/ui"

type CollectionFieldsDefinition = {
	collectionId: string
	namespace: string
}

interface Props extends definition.BaseProps {
	definition: CollectionFieldsDefinition
}

const WIRE_NAME = "collectionFields"

const CollectionFields: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionCond = context.merge(definition.collectionId)
	//const namespace = context.merge(definition.namespace)

	// const fieldsMeta = uesio.builder.useMetadataList(
	// 	context,
	// 	"FIELD",
	// 	namespace,
	// 	collectionCond
	// )

	// console.log({ fieldsMeta })

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
	)
}

export default CollectionFields
