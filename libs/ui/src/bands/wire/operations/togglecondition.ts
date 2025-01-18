import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { toggleCondition, getFullWireId } from ".."

export default (context: Context, wireName: string, id: string) => {
  const viewId = context.getViewId()
  if (viewId)
    dispatch(
      toggleCondition({
        entity: getFullWireId(viewId, wireName),
        id,
      }),
    )
  return context
}
