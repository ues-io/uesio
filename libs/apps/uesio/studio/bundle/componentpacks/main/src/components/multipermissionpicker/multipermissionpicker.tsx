import { definition, api, component, wire, signal } from "@uesio/ui"
import omit from "lodash/omit"

type PermissionFieldDefinition = wire.FieldMetadata

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
  const ID_FIELD = "uesio/core.id"
  const NAME_FIELD = "uesio/studio.name"
  const NAMESPACE_FIELD = "uesio/studio.namespace"
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

  // This field will contain the permissions data as a map of values,
  // where each key is one of the permissionsFields and the value is a boolean
  const getDataValue = () =>
    permsStorageRecord.getFieldValue<wire.PlainWireRecord>(fieldId) || {}
  const updateDataValue = (newValue: wire.PlainWireRecord) =>
    permsStorageRecord.update(fieldId, newValue, context)
  const getPermRecord = (recordId: string) => {
    const existingPerms = getDataValue()[recordId] as Record<string, boolean>
    const [namespace, name] = component.path.parseKey(recordId)
    const itemPerms = {} as Record<string, wire.PlainFieldValue>
    // ensure all perm fields are set with a default
    permissionFields.forEach(({ name = DefaultFieldName, type }) => {
      if (type === "CHECKBOX") {
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
      }
      if (existingPerms && name in existingPerms) {
        itemPerms[name] = existingPerms[name]
      }
    })
    itemPerms[ID_FIELD] = recordId
    itemPerms[NAME_FIELD] = name
    itemPerms[NAMESPACE_FIELD] = namespace

    return itemPerms
  }

  const permsDataValue = getDataValue()

  if (!permsDataValue) return null

  const handlePermUpdate = (
    field: string,
    value: boolean,
    recordId: string,
  ) => {
    let recordPerms
    if (field === DefaultFieldName) {
      recordPerms = value
    } else {
      recordPerms = getPermRecord(recordId)
      recordPerms[field] = value
      recordPerms = omit(recordPerms, [ID_FIELD, NAME_FIELD, NAMESPACE_FIELD])
    }
    updateDataValue({
      ...getDataValue(),
      [recordId]: recordPerms,
    } as wire.PlainWireRecord)
  }

  // Iterate over the wires in the order specified by the sourceWires prop
  // to ensure the items are in the order requested
  const sourceWiresList = sourceWires
    .map((wireName) => sourceWiresMap[wireName])
    .filter((wire) => !!wire)
  const initialValues = sourceWiresList
    .flatMap((wire: wire.Wire) => {
      const collection = wire.getCollection()
      const nameField = collection.getNameField()
      let nameFieldId = ID_FIELD
      if (nameField) {
        nameFieldId = nameField.getId()
      }
      const itemNames = wire
        .getData()
        .map(
          (record) =>
            record.getFieldValue<string>("uesio/studio.namespace") +
            "." +
            record.getFieldValue<string>(nameFieldId),
        )
      itemNames.sort()
      return itemNames
    })
    .reduce(
      (acc, itemName) => ({
        ...acc,
        [itemName]: getPermRecord(itemName),
      }),
      {},
    )

  const firstCollectionLabel = sourceWiresList[0]?.getCollection().getLabel()
  const tableFields = [
    {
      name: ID_FIELD,
      type: "TEXT",
      label: itemColumnLabel || firstCollectionLabel,
      createable: false,
      updateable: false,
    },
    {
      name: NAME_FIELD,
      type: "TEXT",
      label: "Name",
    },
    {
      name: NAMESPACE_FIELD,
      type: "TEXT",
      label: "Namespace",
    },
  ].concat(
    permissionFields.map((field) => ({
      ...field,
      name: field.name || DefaultFieldName,
      label: field.label || `Allow access to ${firstCollectionLabel}`,
      accessible: true,
      createable: true,
      updateable: true,
    })),
  )

  return (
    <DynamicTable
      id={dynamicTableId}
      context={context.deleteWorkspace()}
      path={path}
      mode={mode}
      fields={tableFields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field,
        }),
        {},
      )}
      columns={tableFields
        .filter(
          (field) =>
            field.type !== "MAP" &&
            field.name !== NAME_FIELD &&
            field.name !== NAMESPACE_FIELD,
        )
        .map((field) => ({
          field: field.name,
        }))}
      initialValues={initialValues}
      onUpdate={handlePermUpdate}
      rowactions={rowactions}
    />
  )
}

export default MultiPermissionPicker
