import { FunctionComponent } from "react"
import { definition, api, component, wire } from "@uesio/ui"

type PermissionPickerDefinition = {
  fieldId: string
  wireName: string
}

interface Props extends definition.BaseProps {
  definition: PermissionPickerDefinition
}

const PermissionPicker: FunctionComponent<Props> = (props) => {
  const CheckboxField = component.getUtility("uesio/io.checkboxfield")
  const TitleBar = component.getUtility("uesio/io.titlebar")
  const {
    context,
    definition: { fieldId, wireName },
  } = props

  const record = context.getRecord()

  const wire = api.wire.useWire(wireName || "", context)

  const workspaceContext = context.getWorkspace()
  if (!workspaceContext) throw new Error("No workspace context provided")

  if (!wire || !record) {
    return null
  }

  const collection = wire.getCollection()
  const nameField = collection.getNameField()
  const nameNameField = nameField?.getId()
  if (!nameNameField) return null

  const mode = context.getFieldMode() || "READ"
  const value = record.getFieldValue<wire.PlainWireRecord>(fieldId) || {}
  const disabled = mode === "READ"
  const data = wire.getData()

  if (!value) return null

  const handleToggle = (listRecord: string) => {
    const hasProperty = getValue(listRecord)
    if (!hasProperty) {
      const updValue = { ...value, [listRecord]: true }
      record.update(fieldId, updValue, context)
    } else {
      const currentValue = value[listRecord]
      const updValue = { ...value, [listRecord]: !currentValue }
      record.update(fieldId, updValue, context)
    }
  }

  const getValue = (itemName: string) => (value[itemName] as boolean) || false

  return (
    <>
      {data.map((record, i) => {
        const itemName =
          record.getFieldValue<string>("uesio/studio.namespace") +
          "." +
          record.getFieldValue<string>(nameNameField)
        return (
          <TitleBar
            key={`${itemName}.${i}`}
            context={context}
            title={itemName}
            actions={
              <CheckboxField
                context={context}
                disabled={disabled}
                setValue={() => handleToggle(itemName)}
                value={getValue(itemName)}
                mode={mode}
              />
            }
          />
        )
      })}
    </>
  )
}

export default PermissionPicker
