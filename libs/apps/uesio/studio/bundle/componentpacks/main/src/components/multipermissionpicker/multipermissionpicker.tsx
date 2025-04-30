import { definition, api, component, wire, signal } from "@uesio/ui"
import omit from "lodash/omit"

type PermissionFieldDefinition = {
  label?: string
  name?: string
}

type MultiPermissionPickerDefinition = {
  fieldId: string
  sourceWires: string[]
  permissionFields: PermissionFieldDefinition[]
  rowactions?: RowAction[]
  itemColumnLabel?: string
}

type RowAction = {
  text: string
  signals: signal.SignalDefinition[]
  type?: "DEFAULT"
}

const DefaultFieldName = "__boolean__"

const MultiPermissionPicker: definition.UC<MultiPermissionPickerDefinition> = (
  props,
) => {
  const NAME_FIELD = "uesio/studio.name"
  const NAMESPACE_FIELD = "uesio/studio.namespace"
  const LABEL_FIELD = "uesio/studio.label"
  const APPICON_FIELD = "uesio/studio.appicon"
  const APPCOLOR_FIELD = "uesio/studio.appcolor"
  const {
    context,
    path,
    definition: {
      itemColumnLabel,
      sourceWires = [],
      permissionFields,
      rowactions,
    },
  } = props
  const fieldId = context.mergeString(props.definition.fieldId)
  const uesioId =
    props.definition[component.COMPONENT_ID] ||
    "multipermissionpicker" + fieldId
  const dynamicTableId = uesioId + "-table"

  const mode = context.getFieldMode() || "READ"

  const DynamicTable = component.getUtility("uesio/io.dynamictable")

  const permsStorageRecord = context.getRecord()

  const sourceWiresMap = api.wire.useWires(sourceWires, context)

  const workspaceContext = context.getWorkspace()
  if (!workspaceContext) throw new Error("No workspace context provided")

  if (
    !sourceWiresMap ||
    !Object.values(sourceWiresMap).length ||
    !permsStorageRecord
  ) {
    return null
  }

  const getItemKey = (record: wire.WireRecord) => {
    const namespace = record.getFieldValue<string>(NAMESPACE_FIELD)
    const name = record.getFieldValue<string>(NAME_FIELD)
    return `${namespace}.${name}`
  }

  // This field will contain the permissions data as a map of values,
  // where each key is one of the permissionsFields and the value is a boolean
  const getDataValue = () =>
    permsStorageRecord.getFieldValue<wire.PlainWireRecord>(fieldId) || {}
  const updateDataValue = (newValue: wire.PlainWireRecord) =>
    permsStorageRecord.update(fieldId, newValue, context)
  const getPermRecord = (recordId: string) => {
    const existingPerms = getDataValue()[recordId] as Record<string, boolean>
    const itemPerms = {} as Record<string, wire.PlainFieldValue>
    // ensure all perm fields are set with a default
    permissionFields.forEach(({ name = DefaultFieldName }) => {
      // backwards compatibility --- perms may be a single boolean, so apply this boolean value to all fields
      const defaultValue =
        typeof existingPerms === "boolean" ? existingPerms : false
      const existingPermValue =
        typeof existingPerms === "object" ? existingPerms[name] : undefined
      itemPerms[name] =
        typeof existingPermValue === "boolean"
          ? existingPermValue
          : defaultValue
      return
    })

    return {
      ...existingPerms,
      ...itemPerms,
    }
  }

  const permsDataValue = getDataValue()

  if (!permsDataValue) return null

  const handlePermUpdate = (
    field: string,
    value: boolean,
    recordId: string,
    record: wire.WireRecord,
  ) => {
    const idValue = getItemKey(record)
    if (!idValue) return
    let recordPerms
    if (field === DefaultFieldName) {
      recordPerms = value
    } else {
      recordPerms = getPermRecord(idValue)
      recordPerms[field] = value
      recordPerms = omit(recordPerms, [
        NAME_FIELD,
        NAMESPACE_FIELD,
        LABEL_FIELD,
        APPICON_FIELD,
        APPCOLOR_FIELD,
      ])
    }
    updateDataValue({
      ...getDataValue(),
      [idValue]: recordPerms,
    })
  }

  // Iterate over the wires in the order specified by the sourceWires prop
  // to ensure the items are in the order requested
  const sourceWiresList = sourceWires
    .map((wireName) => sourceWiresMap[wireName])
    .filter((wire) => !!wire)
  const initialValues = sourceWiresList
    .flatMap((wire: wire.Wire) => {
      const records = wire.getData()
      return records.sort((a, b) => {
        const keyA = getItemKey(a)
        const keyB = getItemKey(b)
        return keyA.localeCompare(keyB)
      })
    })
    .map((record) => {
      const itemKey = getItemKey(record)
      const recordData = getPermRecord(itemKey)
      recordData[NAME_FIELD] = record.getFieldValue<string>(NAME_FIELD)
      recordData[NAMESPACE_FIELD] =
        record.getFieldValue<string>(NAMESPACE_FIELD)
      recordData[LABEL_FIELD] = record.getFieldValue<string>(LABEL_FIELD)
      recordData[APPICON_FIELD] = record.getFieldValue<string>(APPICON_FIELD)
      recordData[APPCOLOR_FIELD] = record.getFieldValue<string>(APPCOLOR_FIELD)
      return recordData
    })

  const firstCollectionLabel = sourceWiresList[0]?.getCollection().getLabel()

  return (
    <DynamicTable
      id={dynamicTableId}
      context={context.deleteWorkspace()}
      variant="uesio/appkit.main"
      path={path}
      mode={mode}
      fields={{
        [NAMESPACE_FIELD]: {
          type: "TEXT",
          label: "Namespace",
        },
        [NAME_FIELD]: {
          type: "TEXT",
          label: "Name",
        },
        ...permissionFields.reduce((acc: Record<string, unknown>, field) => {
          const fieldName = field.name || DefaultFieldName
          if (fieldName) {
            acc[fieldName] = {
              ...field,
              name: fieldName,
              label: field.label || `Allow access to ${firstCollectionLabel}`,
              type: "CHECKBOX",
              accessible: true,
              createable: true,
              updateable: true,
            }
          }
          return acc
        }, {}),
      }}
      columns={[
        ...[
          {
            label: itemColumnLabel || firstCollectionLabel,
            components: [
              {
                "uesio/studio.item_metadata": {},
              },
            ],
            width: "200px",
          },
        ],
        ...permissionFields.map((field) => ({
          field: field.name || DefaultFieldName,
        })),
      ]}
      initialValues={initialValues}
      onUpdate={handlePermUpdate}
      rowactions={rowactions}
    />
  )
}

export default MultiPermissionPicker
