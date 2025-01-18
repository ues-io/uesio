import { api, component, context, wire, definition, signal } from "@uesio/ui"
import { MutableRefObject } from "react"
import { useDeepCompareEffect } from "react-use"

type RowAction = {
  text: string
  signals: signal.SignalDefinition[]
  type?: "DEFAULT"
}
interface DynamicTableProps {
  path: string
  fields: Record<string, wire.ViewOnlyField>
  rowactions?: RowAction[]
  initialValues: Record<string, wire.PlainWireRecord>
  columns?: definition.DefinitionList
  mode?: context.FieldMode
  onUpdate?: (
    field: string,
    value: wire.FieldValue,
    recordId: string,
    record: wire.PlainWireRecord,
  ) => void
  wireRef?: MutableRefObject<wire.Wire | undefined>
}

const createRecordsInWire = (
  wire: wire.Wire,
  initialValues: Record<string, wire.PlainWireRecord>,
) => {
  Object.entries(initialValues).forEach(([recordId, initialValue]) => {
    wire.createRecord(initialValue, false, recordId)
  })
}

const DynamicTable: definition.UtilityComponent<DynamicTableProps> = (
  props,
) => {
  const {
    context,
    id,
    fields,
    rowactions,
    columns,
    path,
    onUpdate,
    initialValues,
    wireRef,
    mode,
  } = props

  const dynamicWireName = "dynamicwire:" + id

  const wire = api.wire.useDynamicWire(
    dynamicWireName,
    {
      viewOnly: true,
      fields,
      init: {
        create: false,
      },
    },
    context,
  )

  // Set the passed in ref to the wire, so our
  // parent component can use this wire.
  if (wireRef) wireRef.current = wire

  useDeepCompareEffect(() => {
    if (!wire || !initialValues) return
    if (!wire.getData().length) {
      createRecordsInWire(wire, initialValues)
    } else if (Object.keys(initialValues).length) {
      wire.empty()
      createRecordsInWire(wire, initialValues)
    }
  }, [!!wire, initialValues])

  api.event.useEvent(
    "wire.record.updated",
    (e) => {
      if (!onUpdate || !e.detail || !wire) return
      const { wireId, recordId, field, value, record } = e.detail
      if (wireId !== wire?.getFullId()) return
      onUpdate?.(field, value, recordId, record)
    },
    [wire],
  )

  if (!wire) return null

  return (
    <component.Component
      componentType="uesio/io.table"
      path={path}
      definition={{
        wire: dynamicWireName,
        columns:
          columns ||
          Object.entries(fields).map(([fieldId, fieldDef]) => ({
            field: fieldId,
            ...fieldDef,
          })),
        mode,
        [component.COMPONENT_ID]: id,
        [component.STYLE_VARIANT]: "uesio/io.default",
        rowactions,
      }}
      context={context}
    />
  )
}

export default DynamicTable
