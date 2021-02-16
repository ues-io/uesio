import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { SaveResponseBatch } from "../../../load/saveresponse"
import { PlainWireRecord } from "../../wirerecord/types"

export default createAsyncThunk<
	SaveResponseBatch,
	{
		context: Context
	},
	UesioThunkAPI
>("viewdef/save", async ({ context }, api) => {
	const changes: Record<string, PlainWireRecord> = {}
	const state = api.getState().viewdef?.entities
	const workspace = context.getWorkspace()

	if (!workspace) throw new Error("No Workspace in context")

	// Loop over view defs
	if (state) {
		for (const defKey of Object.keys(state)) {
			const defState = state[defKey]
			if (defState?.yaml === defState?.originalYaml) {
				continue
			}
			if (defState?.yaml) {
				changes[defKey] = {
					"studio.definition": defState.yaml.toString(),
					"studio.id": `${workspace.app}_${workspace.name}_${defState.name}`,
				}
			}
		}
	}
	return api.extra.saveData(context, {
		wires: [
			{
				wire: "saveview",
				collection: "studio.views",
				changes,
				deletes: {},
			},
		],
	})
})
