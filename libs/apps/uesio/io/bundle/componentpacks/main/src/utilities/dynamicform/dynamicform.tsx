import { api, wire, definition, component } from "@uesio/ui"
import { RefObject } from "react"
import List from "../../components/list/list"
import { useDeepCompareEffect } from "react-use"

interface FormProps {
  path: string
  fields: Record<string, wire.ViewOnlyField>
  content?: definition.DefinitionList
  onUpdate?: (
    field: string,
    value: wire.FieldValue,
    record: wire.WireRecord,
  ) => void
  initialValue?: wire.PlainWireRecord
  wireRef?: RefObject<wire.Wire | undefined>
  events?: wire.WireEvent[]
}

const DynamicForm: definition.UtilityComponent<FormProps> = (props) => {
  const {
    context,
    content,
    events,
    id,
    fields,
    path,
    onUpdate,
    initialValue,
    wireRef,
  } = props

  const wireId = "dynamicwire:" + id
  const wire = api.wire.useDynamicWire(
    wireId,
    {
      viewOnly: true,
      events,
      fields,
      init: {
        create: true,
      },
    },
    context,
  )

  // Set the passed in ref to the wire, so our
  // parent component can use this wire.
  if (wireRef) {
    wireRef.current = wire
  }

  const isLoaded = wire ? !wire.isLoading() : false
  const batchId = wire ? wire.getBatchId() : ""

  useDeepCompareEffect(() => {
    const wire = context.getWire(wireId)
    if (!initialValue || !wire || !isLoaded) return
    const record = wire.getFirstRecord()
    if (!record) return
    record.setAll(initialValue)
  }, [wireId, initialValue, isLoaded, batchId])

  api.event.useEvent(
    "wire.record.updated",
    (e) => {
      if (!onUpdate || !e.detail || !wire || !isLoaded) return
      const { wireId, recordId, field, value, record } = e.detail
      if (wireId !== wire?.getFullId()) return
      if (!record || recordId !== record?.getId()) return
      onUpdate?.(field, value, record)
    },
    [wire],
  )

  if (!wire) return null

  return (
    <List
      path={path}
      definition={{
        mode: "EDIT",
        wire: wireId,
        [component.COMPONENT_ID]: id,
        components:
          content ||
          wire.getFields().map((field) => ({
            "uesio/io.field": {
              fieldId: field.id,
            },
          })) ||
          [],
      }}
      context={context.addWireFrame({
        view: wire.getViewId(),
        wire: wire.getId(),
      })}
    />
  )
}

export default DynamicForm
