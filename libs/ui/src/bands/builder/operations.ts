import { Context } from "../../context/context"

import { dispatch, getCurrentState } from "../../store/store"

import { PlainWireRecord } from "../wirerecord/types"
import {
	save as saveBuilder,
	cancel as cancelBuilder,
	setDefinitionContent,
} from "."
import { parseKey } from "../../component/path"
import { UNIQUE_KEY_FIELD } from "../collection/types"
import { batch } from "react-redux"
import { platform } from "../../platform/platform"

const cancel = (context: Context) => {
	const state = getCurrentState().metadatatext?.entities
	if (!state) return context

	batch(() => {
		for (const defKey of Object.keys(state)) {
			const defState = state[defKey]
			if (!defState) continue
			if (defState.content === defState.original) {
				continue
			}
			if (!defState.original) continue

			dispatch(
				setDefinitionContent({
					metadataType: defState.metadatatype,
					metadataItem: defState.key,
					content: defState.original,
				})
			)
		}
		dispatch(cancelBuilder())
	})

	return context
}

const save = async (context: Context) => {
	const changes: Record<string, PlainWireRecord> = {}
	const state = getCurrentState().metadatatext?.entities
	const workspace = context.getWorkspace()

	if (!workspace) throw new Error("No Workspace in context")
	if (!state) return context

	// Loop over view defs
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

export { save, cancel }
