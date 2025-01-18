import { Context } from "../../../context/context"
import { unmarkForDelete } from ".."
import { dispatch } from "../../../store/store"

export default (context: Context, wireId: string) => {
  const records = context.getRecords(wireId)

  if (!records) return context

  for (const record of records) {
    dispatch(
      unmarkForDelete({
        entity: record.getWire().getFullId(),
        recordId: record.getId(),
      }),
    )
  }

  return context
}
