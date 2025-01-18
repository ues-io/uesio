import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { addCondition, getFullWireId } from ".."
import loadWiresOp from "./load"
import { NoValueBehavior } from "../conditions/conditions"

const SEARCH_CONDITION_ID = "uesio.search"

export default async (
  context: Context,
  wireName: string,
  search: string,
  fields?: string[],
  noValueBehavior?: NoValueBehavior,
) => {
  const viewId = context.getViewId()
  if (!viewId) return context
  const entity = getFullWireId(viewId, wireName)
  dispatch(
    addCondition({
      condition: {
        type: "SEARCH",
        value: search,
        id: SEARCH_CONDITION_ID,
        fields,
        noValueBehavior,
      },
      entity,
    }),
  )

  await loadWiresOp(context, [wireName])
  return context
}
