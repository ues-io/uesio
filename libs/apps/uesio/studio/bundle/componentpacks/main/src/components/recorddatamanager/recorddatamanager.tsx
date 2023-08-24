import { FunctionComponent } from "react"
import { definition, api, wire, component, metadata } from "@uesio/ui"
import omit from "lodash/omit"

type DataManagerDefinition = {
	recordID: string
	collectionId: wire.CollectionKey
	wireId: string
	listId: string
}

interface Props extends definition.BaseProps {
	definition: DataManagerDefinition
}

const getWireDefinition = (
	recordID: string,
	collection: wire.CollectionKey,
	fields: Record<string, unknown> | undefined
) => {
	if (!fields || !collection || !recordID) return null
	return {
		collection,
		fields: Object.fromEntries(
			Object.entries(fields).map(([fieldId]) => [fieldId, null])
		),
		conditions: [
			{
				field: "uesio/core.id",
				value: recordID,
				valueSource: "VALUE",
			},
		],
	} as wire.WireDefinition
}

const UESIO_BUILTIN = [
	"uesio/core.id",
	"uesio/core.uniquekey",
	"uesio/core.owner",
	"uesio/core.createdat",
	"uesio/core.createdby",
	"uesio/core.updatedat",
	"uesio/core.updatedby",
]

const getComponents = (
	fieldsMeta: Record<string, metadata.MetadataInfo>
): definition.DefinitionList => {
	const rest = omit(fieldsMeta, ...UESIO_BUILTIN)
	const fields = Object.values(rest) as metadata.MetadataInfo[]

	fields.sort((a, b) =>
		a.key
			.replace(a.namespace, "")
			.localeCompare(b.key.replace(b.namespace, ""))
	)

	return [
		{
			"uesio/io.grid": {
				items: fields.map((field) => ({
					"uesio/io.field": {
						fieldId: field.key,
					},
				})),
				"uesio.variant": "uesio/io.four_columns",
			},
		},
		{
			"uesio/io.grid": {
				items: UESIO_BUILTIN.map((field) => ({
					"uesio/io.field": {
						fieldId: field,
					},
				})),
				"uesio.variant": "uesio/io.four_columns",
			},
		},
	]
}

const RecordDataManager: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: {
			collectionId,
			wireId = "collectionData",
			listId = "recordDataList",
			recordID,
		},
	} = props

	const collection = context.mergeString(collectionId) as wire.CollectionKey

	const [fieldsMeta] = api.builder.useMetadataList(
		context,
		"FIELD",
		"",
		collection
	)

	const wireDef = getWireDefinition(recordID, collection, fieldsMeta)

	const dataWire = api.wire.useDynamicWire(wireId, wireDef, context)

	if (!dataWire || !fieldsMeta) return null

	return (
		<component.Component
			componentType="uesio/io.list"
			definition={{
				id: listId,
				wire: wireId,
				mode: "EDIT",
				components: getComponents(fieldsMeta),
			}}
			path={props.path}
			context={context}
		/>
	)
}

export default RecordDataManager
