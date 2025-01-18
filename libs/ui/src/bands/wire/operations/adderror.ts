import { Context } from "../../../context/context"
import { addError } from ".."
import { dispatch } from "../../../store/store"

export default (context: Context, fieldId: string, message: string) => {
  const record = context.getRecord()
  if (!record) return context
  dispatch(
    addError({
      entity: record.getWire().getFullId(),
      recordId: record.getId(),
      fieldId,
      message,
    }),
  )
  return context
}
