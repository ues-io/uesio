import { dispatch } from "../../../store/store"
import { Context, Mergeable } from "../../../context/context"
import { addCondition, getFullWireId } from ".."
import { WireConditionState } from "../conditions/conditions"

export default (
  context: Context,
  wireName: string,
  condition: WireConditionState,
) => {
  const viewId = context.getViewId()
  if (viewId)
    dispatch(
      addCondition({
        entity: getFullWireId(viewId, wireName),
        condition: (condition
          ? context.mergeMap(condition as Record<string, Mergeable>)
          : undefined) as WireConditionState,
      }),
    )
  return context
}
