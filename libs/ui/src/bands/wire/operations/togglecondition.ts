import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { toggleCondition, getFullWireId } from ".."

export default (context: Context, wirename: string, path: string): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()

		console.log({ viewId })

		if (viewId) {
			const test = getFullWireId(viewId, wirename)
			console.log({ wirename, path, test })
			dispatch(
				toggleCondition({
					entity: getFullWireId(viewId, wirename),
					path,
				})
			)
		}
		return context
	}
