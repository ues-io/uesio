import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { empty } from ".."

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (viewId) dispatch(empty({ entity: `${viewId}/${wirename}` }))
		return context
	}
