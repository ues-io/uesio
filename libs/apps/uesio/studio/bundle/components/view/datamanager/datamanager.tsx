import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"

type DataManagerDefinition = {
	collectionId: string
	namespace: string
}

interface Props extends definition.BaseProps {
	definition: DataManagerDefinition
}

const WIRE_NAME = "collectionData"

const getWireDefinition = (
	collection: string,
	fields: Record<string, unknown> | undefined
) => {
	if (!fields || !collection) return null
	return {
		collection,
		fields: Object.fromEntries(
			Object.entries(fields).map(([fieldId]) => [fieldId, null])
		),
	}
}

const DataManager: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collection = context.merge(definition.collectionId)
	const namespace = context.merge(definition.namespace)

	const fieldsMeta = uesio.builder.useMetadataList(
		context,
		"FIELD",
		namespace,
		collection
	)

	const wireDef = getWireDefinition(collection, fieldsMeta)

	const dataWire = uesio.wire.useDynamicWire(WIRE_NAME, wireDef, true)

	if (!dataWire || !fieldsMeta) return null

	return (
		<component.Component
			componentType="uesio/io.table"
			definition={{
				id: "collectionDataTable",
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
				columns: Object.keys(fieldsMeta).map((field) => ({
					field,
				})),
			}}
			path={props.path}
			context={context}
		/>
	)
}

export default DataManager
