import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { removeCondition, getFullWireId } from ".."

export default (context: Context, wireName: string, conditionId: string) => {
  const viewId = context.getViewId()
  if (viewId)
    dispatch(
      removeCondition({
        entity: getFullWireId(viewId, wireName),
        conditionId,
      }),
    )
  return context
}
