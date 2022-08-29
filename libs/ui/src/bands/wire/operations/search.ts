import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { addCondition, removeCondition, getFullWireId } from ".."
import loadWiresOp from "./load"

const SEARCH_CONDITION_ID = "uesio.search"

export default (
		context: Context,
		wirename: string,
		search: string,
		fields?: string[]
	): ThunkFunc =>
	async (dispatch) => {
		const viewId = context.getViewId()
		if (!viewId) return context
		const entity = getFullWireId(viewId, wirename)
		dispatch(
			search
				? addCondition({
						condition: {
							type: "SEARCH",
							value: search,
							active: true,
							id: SEARCH_CONDITION_ID,
							fields,
						},
						entity,
				  })
				: removeCondition({
						conditionId: SEARCH_CONDITION_ID,
						entity,
				  })
		)

		await dispatch(loadWiresOp(context, [wirename]))
		return context
	}
