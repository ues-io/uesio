import { FunctionComponent, useEffect } from "react"
import { definition, wire, hooks, component, context } from "@uesio/ui"

type CollectionFieldsDefinition = {
	collectionId: string
	app: string
	bundleapp: string
	workspace: string
}

interface Props extends definition.BaseProps {
	definition: CollectionFieldsDefinition
}

const WIRE_NAME = "collectionFields"

const CollectionFields: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionCond = context.merge(definition.collectionId)
	const bundleapp = context.merge(definition.bundleapp)
	const app = context.merge(definition.app)
	const workspace = context.merge(definition.workspace)

	console.log({ collectionCond })
	console.log(definition.collectionId)

	const newContext = context.addFrame({
		workspace: {
			name: workspace || "",
			app: app || "",
		},
	})

	const fieldsMeta = uesio.builder.useMetadataList(
		newContext,
		"FIELD",
		bundleapp,
		collectionCond
	)

	console.log({ fieldsMeta })

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
		//TO-DO add WS condition ??
	]

	uesio.wire.initWires(context, {
		[WIRE_NAME]: { collection, fields, conditions },
	})
	uesio.wire.loadWires(context, [WIRE_NAME])

	return (
		<component.Component
			componentType="uesio/io.table"
			definition={{
				id: "collectionFieldsTable",
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
