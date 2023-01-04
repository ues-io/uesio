import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { empty, getFullWireId } from ".."

export default (context: Context, wirename: string) => {
	const viewId = context.getViewId()
	if (viewId) dispatch(empty({ entity: getFullWireId(viewId, wirename) }))
	return context
}
