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
  ATTACHMENTS_FIELD,
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
  recordID: string | undefined,
) => {
  if (!collectionFields || !collectionFields.length) return null
  const createMode = !recordID
  return {
    collection,
    fields: Object.fromEntries(
      collectionFields.map((f) => {
        const fieldId = f.getId()
        const subFields =
          fieldId === ATTACHMENTS_FIELD
            ? {
                fields: {
                  "uesio/core.mimetype": {},
                  "uesio/core.contentlength": {},
                  "uesio/core.path": {},
                },
              }
            : {}
        return [fieldId, subFields]
      }),
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

const getLoadableFields = (
  collectionMetadata: collection.Collection | undefined,
  isNewRecord: boolean,
) => {
  if (!collectionMetadata) return []
  return (
    collectionMetadata
      .getFields()
      .filter(
        (f) =>
          f.getType() !== "REFERENCEGROUP" || f.getId() === ATTACHMENTS_FIELD,
      )
      .filter((f) =>
        isNewRecord
          ? f.getCreateable()
          : f.getUpdateable() || f.getAccessible(),
      ) || []
  )
}

const COMMON_FIELDS = [
  ID_FIELD,
  UNIQUE_KEY_FIELD,
  OWNER_FIELD,
  CREATED_AT_FIELD,
  CREATED_BY_FIELD,
  UPDATED_AT_FIELD,
  UPDATED_BY_FIELD,
  ATTACHMENTS_FIELD,
]

const getGridFromFieldDefs = (fieldDefs: collection.Field[]) => ({
  "uesio/io.box": {
    "uesio.variant": "uesio/appkit.primarysection",
    components: [
      {
        "uesio/io.grid": {
          items: fieldDefs.map((fieldDef) => ({
            "uesio/io.field": {
              fieldId: fieldDef.getId(),
            },
          })),
          [STYLE_VARIANT]: "uesio/appkit.four_columns",
        },
      },
    ],
  },
})

const getComponents = (
  collectionFields: collection.Field[],
  recordID: string | undefined,
): definition.DefinitionList => {
  const createMode = !recordID
  // Ignore the common fields for the top grid, we will add those in a special grid below
  const useFields = collectionFields.filter(
    (f) => !COMMON_FIELDS.includes(f.getId()),
  )
  const fields = useFields.sort((a, b) =>
    a.getName().localeCompare(b.getName()),
  )
  const grids: definition.DefinitionList = [getGridFromFieldDefs(fields)]
  // Add in common fields
  if (!createMode) {
    grids.push({
      "uesio/appkit.section_audit_info": {},
    })
    grids.push({
      "uesio/appkit.section_attachments": {
        allowDelete: true,
        allowCreate: true,
      },
    })
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

  const collectionKey = context.mergeString(collectionId) as wire.CollectionKey

  const collectionMetadata = api.collection.useCollection(
    context,
    collectionKey,
    {
      needAllFieldMetadata: true,
    },
  )

  const isNewRecord = !recordID
  const collectionFields = getLoadableFields(collectionMetadata, isNewRecord)

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
export { COMMON_FIELDS }
export default RecordDataManager
