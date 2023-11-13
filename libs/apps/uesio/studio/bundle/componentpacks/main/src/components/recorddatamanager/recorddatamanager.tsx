import { api, collection, component, definition, wire } from "@uesio/ui"
const { STYLE_VARIANT } = component
const {
	ID_FIELD,
	UNIQUE_KEY_FIELD,
	CREATED_AT_FIELD,
	CREATED_BY_FIELD,
	OWNER_FIELD,
	UPDATED_AT_FIELD,
	UPDATED_BY_FIELD,
} = collection

type DataManagerDefinition = {
	collectionId: wire.CollectionKey
	wireId: string
	listId: string
	// If recordID is not provided, a new record will be created in the wire
	recordID?: string
}

const getWireDefinition = (
	collection: wire.CollectionKey,
	collectionFields: collection.Field[],
	recordID: string | undefined
) => {
	if (!collectionFields || !collectionFields.length) return null
	const createMode = !recordID
	return {
		collection,
		fields: Object.fromEntries(
			collectionFields.map((f) => [f.getId(), {}])
		),
		conditions: createMode
			? undefined
			: [
					{
						field: ID_FIELD,
						value: recordID,
						valueSource: "VALUE",
					},
			  ],
		init: {
			query: !createMode,
			create: createMode,
		},
	} as wire.WireDefinition
}

const COMMON_FIELDS = [
	ID_FIELD,
	UNIQUE_KEY_FIELD,
	OWNER_FIELD,
	CREATED_AT_FIELD,
	CREATED_BY_FIELD,
	UPDATED_AT_FIELD,
	UPDATED_BY_FIELD,
]

const getGridFromFieldDefs = (fieldDefs: Record<string, unknown>[]) => ({
	"uesio/io.grid": {
		items: fieldDefs.map((fieldDef) => ({
			"uesio/io.field": fieldDef,
		})),
		[STYLE_VARIANT]: "uesio/io.four_columns",
	},
})

const fieldDef = (fieldId: string) => ({
	fieldId,
})

const getGridFromFieldIds = (fieldIds: string[]) =>
	getGridFromFieldDefs(fieldIds.map(fieldDef))

const commonFieldDefs = [
	fieldDef(ID_FIELD),
	fieldDef(OWNER_FIELD),
	{
		fieldId: CREATED_BY_FIELD,
		user: {
			subtitle: `$Time{${CREATED_AT_FIELD}}`,
		},
	},
	{
		fieldId: UPDATED_BY_FIELD,
		user: {
			subtitle: `$Time{${UPDATED_AT_FIELD}}`,
		},
	},
]

const getComponents = (
	collectionFields: collection.Field[],
	recordID: string | undefined
): definition.DefinitionList => {
	const createMode = !recordID
	// Ignore the common fields for the top grid, we will add those in a special grid below
	const useFields = collectionFields.filter(
		(f) => !COMMON_FIELDS.includes(f.getId())
	)
	const fields = useFields.sort((a, b) =>
		a.getName().localeCompare(b.getName())
	)
	const grids = [getGridFromFieldIds(fields.map((field) => field.getId()))]
	// Add in common fields
	if (!createMode) {
		grids.push(getGridFromFieldDefs(commonFieldDefs))
	}
	return grids
}

const RecordDataManager: definition.UC<DataManagerDefinition> = (props) => {
	const {
		context,
		definition: {
			collectionId,
			wireId = "collectionData",
			listId = "recordDataList",
			recordID,
		},
	} = props

	const collectionKey = context.mergeString(
		collectionId
	) as wire.CollectionKey

	const collectionMetadata = api.collection.useCollection(
		context,
		collectionKey,
		{
			needAllFieldMetadata: true,
		}
	)

	const collectionFields =
		collectionMetadata
			?.getFields()
			.filter((f) =>
				recordID
					? f.getUpdateable() || f.getAccessible()
					: f.getCreateable()
			) || []

	const hasAllFields = collectionMetadata?.hasAllFields()

	const wireDef = hasAllFields
		? getWireDefinition(collectionKey, collectionFields, recordID)
		: null

	const dataWire = api.wire.useDynamicWire(wireId, wireDef, context)

	if (!dataWire || !collectionMetadata || !hasAllFields) return null

	const components = getComponents(collectionFields, recordID)

	return (
		<component.Component
			componentType="uesio/io.list"
			definition={{
				id: listId,
				wire: wireId,
				mode: "EDIT",
				components,
			}}
			path={props.path}
			context={context}
		/>
	)
}

export default RecordDataManager
