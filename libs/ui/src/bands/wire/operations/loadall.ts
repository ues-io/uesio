import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import loadNextBatchOp from "./loadnextbatch"
import { selectWire } from "../selectors"

const loadAllOp = createAsyncThunk<
	void,
	{
		context: Context
		wires?: string[]
	},
	UesioThunkAPI
>("wire/loadAll", async ({ context, wires }, api) => {
	// Turn the list of wires into a load request
	console.log("bleh")
	const viewId = context.getViewId()
	if (!viewId) throw new Error("No ViewId in Context")

	// Get the wires that still need to be loaded
	const loadWires = wires?.flatMap((wireName) => {
		const wireData = selectWire(api.getState(), viewId, wireName)
		if (wireData?.more) {
			return [wireName]
		}
		return []
	})

	if (!loadWires || loadWires.length === 0) return

	await api.dispatch(
		loadNextBatchOp({
			context,
			wires: loadWires,
		})
	)

	await api.dispatch(loadAllOp({ context, wires: loadWires }))
})

export default loadAllOp
