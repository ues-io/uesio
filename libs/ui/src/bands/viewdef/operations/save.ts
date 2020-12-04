import { createAsyncThunk } from "@reduxjs/toolkit"
import { SaveViewRequest, SaveViewResponse } from "../../../platform/platform"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"

export default createAsyncThunk<
	SaveViewResponse,
	{
		context: Context
	},
	UesioThunkAPI
>("viewdef/save", async ({ context }, api) => {
	const saveRequest: SaveViewRequest = {}
	const state = api.getState().viewdef?.entities
	// Loop over view defs
	if (state) {
		for (const defKey of Object.keys(state)) {
			const defState = state[defKey]
			if (defState?.yaml === defState?.originalYaml) {
				continue
			}
			if (defState?.yaml) {
				saveRequest[defKey] = defState.yaml.toString()
			}
		}
	}
	return api.extra.saveViews(context, saveRequest)
})
