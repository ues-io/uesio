import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { empty, getFullWireId } from ".."

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (viewId) dispatch(empty({ entity: getFullWireId(viewId, wirename) }))
		return context
	}
