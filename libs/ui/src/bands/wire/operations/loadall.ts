import { Context } from "../../../context/context"
import loadNextBatchOp from "./loadnextbatch"
import { selectWire } from ".."
import { ThunkFunc } from "../../../store/store"

const loadAllOp =
	(context: Context, wires?: string[]): ThunkFunc =>
	async (dispatch, getState) => {
		// Turn the list of wires into a load request
		const viewId = context.getViewId()
		if (!viewId) throw new Error("No ViewId in Context")

		// Get the wires that still need to be loaded
		const loadWires = wires?.filter(
			(wireName) => selectWire(getState(), viewId, wireName)?.more
		)

		if (!loadWires || loadWires.length === 0) return context

		await dispatch(loadNextBatchOp(context, loadWires))
		return dispatch(loadAllOp(context, loadWires))
	}

export default loadAllOp
