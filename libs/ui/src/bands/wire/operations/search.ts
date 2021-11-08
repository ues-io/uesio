import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AnyAction } from "redux"
import { addCondition, removeCondition } from ".."
import loadWiresOp from "./load"

const SEARCH_CONDITION_ID = "uesio.search"

export default (context: Context, wirename: string, search: string) =>
	async (dispatch: Dispatcher<AnyAction>) => {
		const viewId = context.getViewId()
		const entity = `${viewId}/${wirename}`
		dispatch(
			search
				? addCondition({
						condition: {
							type: "SEARCH",
							value: search,
							active: true,
							id: SEARCH_CONDITION_ID,
						},
						entity,
				  })
				: removeCondition({
						conditionId: SEARCH_CONDITION_ID,
						entity,
				  })
		)
		await dispatch(loadWiresOp({ context, wires: [wirename] }))
		return context
	}
