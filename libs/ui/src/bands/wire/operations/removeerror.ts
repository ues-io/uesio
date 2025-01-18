import { Context } from "../../../context/context"
import { dispatch } from "../../../store/store"
import { removeError } from ".."

const wireRemoveError = (context: Context, fieldId: string) => {
  const record = context.getRecord()
  if (!record) return context
  dispatch(
    removeError({
      entity: record.getWire().getFullId(),
      recordId: record.getId(),
      fieldId,
    }),
  )
  return context
}

export default wireRemoveError
