import { FunctionComponent } from "react"
import { definition, api, component, metadata, wire } from "@uesio/ui"

type DataManagerDefinition = {
	collectionId: wire.CollectionKey
	wireId: string
	tableId: string
}

interface Props extends definition.BaseProps {
	definition: DataManagerDefinition
}

const getWireDefinition = (
	collection: wire.CollectionKey,
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

type ColumnDefinition = {
	field: string
}

const getColumns = (
	fieldsMeta: Record<string, metadata.MetadataInfo>
): ColumnDefinition[] => {
	const fields = Object.values(fieldsMeta)
	fields.sort((a, b) =>
		a.key
			.replace(a.namespace, "")
			.localeCompare(b.key.replace(b.namespace, ""))
	)
	return fields.map((field) => ({
		field: field.key,
	}))
}

const DataManager: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: {
			collectionId,
			wireId = "collectionData",
			tableId = "collectionDataTable",
		},
	} = props

	const collection = context.mergeString(collectionId) as wire.CollectionKey

	const [fieldsMeta] = api.builder.useMetadataList(
		context,
		"FIELD",
		"",
		collection
	)

	const wireDef = getWireDefinition(collection, fieldsMeta)

	const dataWire = api.wire.useDynamicWire(wireId, wireDef, context)

	if (!dataWire || !fieldsMeta) return null

	return (
		<component.Component
			componentType="uesio/io.table"
			definition={{
				id: tableId,
				wire: wireId,
				mode: "EDIT",
				rownumbers: true,
				selectable: true,
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
					{
						text: "Manage",
						signals: [
							{
								signal: "context/CLEAR",
								type: "WORKSPACE",
							},
							{
								signal: "route/NAVIGATE",
								path: "app/$Param{app}/workspace/$Param{workspacename}/data/$Param{namespace}/$Param{collectionname}/${uesio/core.id}",
							},
						],
					},
				],
				columns: getColumns(fieldsMeta),
			}}
			path={props.path}
			context={context}
		/>
	)
}

export default DataManager
