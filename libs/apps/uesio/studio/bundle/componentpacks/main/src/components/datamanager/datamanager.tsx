import { FunctionComponent } from "react"
import {
  definition,
  api,
  collection,
  component,
  wire,
  context,
} from "@uesio/ui"
const {
  ID_FIELD,
  UNIQUE_KEY_FIELD,
  OWNER_FIELD,
  UPDATED_AT_FIELD,
  UPDATED_BY_FIELD,
  CREATED_AT_FIELD,
  CREATED_BY_FIELD,
} = collection

type DataManagerDefinition = {
  collectionId: wire.CollectionKey
  wireId?: string
  tableId?: string
  searchboxId?: string
}

interface Props extends definition.BaseProps {
  definition: DataManagerDefinition
}

const getWireDefinition = (
  collectionKey: wire.CollectionKey,
  collectionMetadata: collection.Collection | undefined,
) => {
  if (!collectionMetadata) return null
  const nameField = collectionMetadata?.getNameField()?.getId()
  return {
    collection: collectionKey,
    fields: Object.fromEntries(
      getLoadableFields(collectionMetadata).map((f) => [f.getId(), {}]),
    ),
    order: [
      {
        field: nameField ? nameField : UNIQUE_KEY_FIELD,
        desc: false,
      },
    ],
    batchsize: 50,
  }
}

type UserOptions = {
  subtitle: string
}

type ColumnDefinition = {
  field: string
  user?: UserOptions
  width?: string
}

const getLoadableFields = (
  collectionMetadata: collection.Collection | undefined,
) => {
  if (!collectionMetadata) return []
  return collectionMetadata
    .getSearchableFields()
    .filter((f) => f.getType() !== "LONGTEXT")
}

const getColumns = (
  collectionMetadata: collection.Collection | undefined,
): ColumnDefinition[] => {
  // We want to display only certain fields here, and in a consistent order:
  // 1. Id
  // 2. Name field
  // 3. Unique Key Field(s)
  // 4. Other text/select fields
  // 5. Owner
  // 6. Created By, Updated By
  if (!collectionMetadata) return []
  const keyFields: ColumnDefinition[] = []
  const keyFieldSet = new Set()
  keyFieldSet.add(ID_FIELD)
  keyFieldSet.add(OWNER_FIELD)
  keyFieldSet.add(UNIQUE_KEY_FIELD)
  const nameField = collectionMetadata.getNameField()?.getId()
  if (nameField && !keyFieldSet.has(nameField)) {
    keyFields.push({
      field: nameField,
      width: "200px",
    })
    keyFieldSet.add(nameField)
  }
  const uniqueKeyFields = collectionMetadata.getUniqueKeyFields()
  if (uniqueKeyFields) {
    // If the Unique Key is NOT the name field or id field,
    // add the unique key components in as well
    uniqueKeyFields.forEach((f) => {
      const fieldId = f?.getId()
      if (fieldId && !keyFieldSet.has(fieldId)) {
        keyFields.push({
          field: fieldId,
          width: "200px",
        })
        keyFieldSet.add(fieldId)
      }
    })
  }
  getLoadableFields(collectionMetadata)
    .filter((f) => !keyFieldSet.has(f.getId()))
    .forEach((f) => {
      const id = f.getId()
      keyFields.push({
        field: id,
      })
      keyFieldSet.add(id)
    })
  return [
    {
      field: ID_FIELD,
      width: "300px",
    },
    ...keyFields,
    {
      field: OWNER_FIELD,
      width: "150px",
    },
    {
      field: CREATED_BY_FIELD,
      width: "200px",
      user: {
        subtitle: `$Time{${CREATED_AT_FIELD}}`,
      },
    },
    {
      field: UPDATED_BY_FIELD,
      width: "200px",
      user: {
        subtitle: `$Time{${UPDATED_AT_FIELD}}`,
      },
    },
  ]
}

const getRecordDataManagerNavigatePath = (ctx: context.Context) =>
  `/app/$Param{app}/${
    ctx.getWorkspace()
      ? "workspace/$Param{workspacename}"
      : "site/$Param{sitename}"
  }/data/$Param{namespace}/$Param{collectionname}/` +
  "${" +
  ID_FIELD +
  "}"

const getSearchFieldIds = (
  collectionMetadata: collection.Collection | undefined,
) => {
  if (!collectionMetadata) {
    return [UNIQUE_KEY_FIELD]
  }
  return getLoadableFields(collectionMetadata).map((f) => f.getId())
}

const DataManager: FunctionComponent<Props> = (props) => {
  const {
    context,
    definition: {
      collectionId,
      wireId = "collectionData",
      tableId = "collectionDataTable",
      searchboxId = "collectionDataSearchbox",
    },
  } = props

  const collectionKey = context.mergeString(collectionId)
  const collectionMetadata = api.collection.useCollection(
    context,
    collectionKey,
    {
      needAllFieldMetadata: true,
    },
  )

  const hasAllFields = collectionMetadata?.hasAllFields()

  const columns = getColumns(collectionMetadata)
  const wireDef = hasAllFields
    ? getWireDefinition(collectionKey, collectionMetadata)
    : null
  const dataWire = api.wire.useDynamicWire(wireId, wireDef, context)

  if (!dataWire || !hasAllFields) return null

  // Have to compute this HERE , not in the signals,
  // so that we still have Workspace / Site Admin context
  const recordDataManagerPath = getRecordDataManagerNavigatePath(context)

  return (
    <>
      <component.Component
        componentType="uesio/io.searchbox"
        definition={{
          id: searchboxId,
          "uesio.variant": "uesio/appkit.main",
          wire: wireId,
          searchFields: getSearchFieldIds(collectionMetadata),
          focusOnRender: true,
        }}
        path={props.path}
        context={context}
      />
      <component.Component
        componentType="uesio/io.table"
        definition={{
          id: tableId,
          "uesio.variant": "uesio/appkit.main",
          wire: wireId,
          mode: "EDIT",
          rownumbers: true,
          selectable: true,
          pagesize: 5,
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
              text: "Manage Record",
              signals: [
                // Need to clear these contexts before calling navigate,
                // so that the path is not prefixed with the workspace/site prefix
                {
                  signal: "context/CLEAR",
                  type: "WORKSPACE",
                },
                {
                  signal: "context/CLEAR",
                  type: "SITE_ADMIN",
                },
                {
                  signal: "context/CLEAR",
                  type: "SITE",
                },
                {
                  signal: "route/NAVIGATE",
                  path: recordDataManagerPath,
                },
              ],
            },
          ],
          columns,
        }}
        path={props.path}
        context={context}
      />
    </>
  )
}

export default DataManager
