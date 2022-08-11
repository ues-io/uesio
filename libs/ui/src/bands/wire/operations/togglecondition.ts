import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { toggleCondition, getFullWireId } from ".."

export default (context: Context, wirename: string, id: string): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (viewId)
			dispatch(
				toggleCondition({
					entity: getFullWireId(viewId, wirename),
					id,
				})
			)
		return context
	}
