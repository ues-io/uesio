import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import {
	addCondition,
	removeCondition,
	getFullWireId,
	getWiresFromDefinitonOrContext,
} from ".."
import loadWiresOp from "./load"
import { listLookupWires } from "../utils"

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

		const wireNames = [wirename]
		const wires = getWiresFromDefinitonOrContext(wireNames, context)
		const lookupWires = listLookupWires(wires)
		const missingLookupWires = lookupWires.filter(
			(w) => !wireNames?.includes(w?.missingDependency || "")
		)

		if (missingLookupWires.length) {
			missingLookupWires.forEach((item) => {
				wireNames.unshift(item.missingDependency)
			})
		}

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

		await dispatch(loadWiresOp(context, wireNames))
		return context
	}
