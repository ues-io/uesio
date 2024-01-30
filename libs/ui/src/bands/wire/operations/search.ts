import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { addCondition, removeCondition, getFullWireId } from ".."
import loadWiresOp from "./load"

const SEARCH_CONDITION_ID = "uesio.search"

export default async (
	context: Context,
	wireName: string,
	search: string,
	fields?: string[]
) => {
	const viewId = context.getViewId()
	if (!viewId) return context
	const entity = getFullWireId(viewId, wireName)
	dispatch(
		search
			? addCondition({
					condition: {
						type: "SEARCH",
						value: search,
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

	await loadWiresOp(context, [wireName])
	return context
}
