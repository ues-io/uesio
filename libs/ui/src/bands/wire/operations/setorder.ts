import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { setOrder, getFullWireId } from ".."
import { MetadataKey } from "../../../metadata/types"

export default (
  context: Context,
  wireName: string,
  order: { field: MetadataKey; desc: boolean }[],
) => {
  const viewId = context.getViewId()
  if (viewId)
    dispatch(
      setOrder({
        entity: getFullWireId(viewId, wireName),
        order,
      }),
    )
  return context
}
