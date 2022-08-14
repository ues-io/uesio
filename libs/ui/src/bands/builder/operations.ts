import { Context } from "../../context/context"

import { ThunkFunc } from "../../store/store"

import { PlainWireRecord } from "../wirerecord/types"
import { save as saveBuilder } from "."

const save =
	(context: Context): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const changes: Record<string, PlainWireRecord> = {}
		const state = getState().viewdef?.entities
		const workspace = context.getWorkspace()

		if (!workspace) throw new Error("No Workspace in context")

		console.log(state)
		// Loop over view defs
		/*
		if (state) {
			for (const defKey of Object.keys(state)) {
				const defState = state[defKey]
				if (!defState) continue
				if (defState.content === defState.original) {
					continue
				}

				const [, name] = parseKey(defState.key)

				if (defState?.content) {
					changes[defKey] = {
						"uesio/studio.definition": defState.content,
						[UNIQUE_KEY_FIELD]: `${workspace.app}:${workspace.name}:${name}`,
					}
				}
			}
		}
		*/

		await platform.saveData(new Context(), {
			wires: [
				{
					wire: "saveview",
					collection: "uesio/studio.view",
					changes,
					deletes: {},
					options: {
						upsert: true,
					},
				},
			],
		})

		dispatch(saveBuilder())

		return context
	}

export default {
	save,
}
