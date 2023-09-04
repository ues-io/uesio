import { FunctionComponent } from "react"
import {
	api,
	collection,
	component,
	definition,
	metadata,
	wire,
} from "@uesio/ui"
import omit from "lodash/omit"
const { STYLE_VARIANT } = component
const { ID_FIELD, UNIQUE_KEY_FIELD } = collection

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
				field: ID_FIELD,
				value: recordID,
				valueSource: "VALUE",
			},
		],
	} as wire.WireDefinition
}

const UESIO_BUILTIN = [
	ID_FIELD,
	UNIQUE_KEY_FIELD,
	"uesio/core.owner",
	"uesio/core.createdat",
	"uesio/core.createdby",
	"uesio/core.updatedat",
	"uesio/core.updatedby",
]

const getGridFromFields = (fieldIds: string[]) => ({
	"uesio/io.grid": {
		items: fieldIds.map((fieldId) => ({
			"uesio/io.field": {
				fieldId,
			},
		})),
		[STYLE_VARIANT]: "uesio/io.four_columns",
	},
})

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
		getGridFromFields(fields.map((field) => field.key)),
		getGridFromFields(UESIO_BUILTIN),
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
