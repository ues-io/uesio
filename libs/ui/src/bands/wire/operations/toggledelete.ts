import { Context } from "../../../context/context"
import markForDeleteOp from "./markfordelete"
import unmarkForDeleteOp from "./unmarkfordelete"

export default (context: Context, wireId: string) => {
  const record = context.getRecord(wireId)
  if (!record) return context
  const recordId = record.getId()
  const isDeleted = record.getWire().isMarkedForDeletion(recordId)
  return isDeleted
    ? unmarkForDeleteOp(context, wireId)
    : markForDeleteOp(context, wireId)
}
