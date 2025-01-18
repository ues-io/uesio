import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { nanoid } from "@reduxjs/toolkit"
import { createRecord } from ".."
import { getDefaultRecord } from "../defaults/defaults"
import { PlainWireRecord } from "../../wirerecord/types"
import Wire from "../class"

const mergeDefaultRecord = ({
  context,
  wire,
  record,
}: {
  context: Context
  wire: Wire
  record?: PlainWireRecord
}) => ({
  ...getDefaultRecord(context, wire),
  ...(record || {}),
})

type CreateRecordOpOptions = {
  context: Context
  record?: PlainWireRecord
  wireName: string
  prepend?: boolean
}

const createRecordOp = ({
  context,
  wireName,
  prepend,
  record,
}: CreateRecordOpOptions) => {
  const wire = context.getWire(wireName)
  if (!wire) return context
  const recordId = nanoid()
  dispatch(
    createRecord({
      recordId,
      record: mergeDefaultRecord({ context, wire, record }),
      entity: wire.getFullId(),
      prepend: !!prepend,
    }),
  )
  return context.addRecordFrame({
    record: recordId,
    wire: wireName,
    view: context.getViewId(),
  })
}

type CreateRecordsOpOptions = {
  context: Context
  records: PlainWireRecord[]
  wireName: string
  prepend?: boolean
}

const createRecordsOp = ({
  context,
  records,
  wireName,
  prepend,
}: CreateRecordsOpOptions) => {
  const wire = context.getWire(wireName)
  if (!wire) return context

  records.forEach((record) => {
    dispatch(
      createRecord({
        recordId: nanoid(),
        record: mergeDefaultRecord({
          context,
          wire,
          record,
        }),
        entity: wire.getFullId(),
        prepend: !!prepend,
      }),
    )
  })

  return context
}

export { createRecordOp, createRecordsOp }
