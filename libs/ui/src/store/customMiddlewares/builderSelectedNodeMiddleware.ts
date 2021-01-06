/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyAction } from "redux"
import toPath from "lodash.topath"
import { changeDefinitionKey } from "../../../src/bands/viewdef"
import { setSelectedNode } from "../../../src/bands/builder"

const builderSelectedeNodeMiddleware = (store: any) => (
	next: (action: AnyAction) => void
) => (action: AnyAction) => {
	const actionType = action.type
	const currentSelectedNode = store.getState()?.builder?.selectedNode
	const newName = action?.payload?.key
	const [nodeType] = toPath(action?.payload?.path) // nodeType is for example wires

	// dispatch to reducer
	next(action)
	// state has now been updated

	if (
		currentSelectedNode &&
		newName &&
		actionType === `${changeDefinitionKey}` &&
		nodeType &&
		typeof nodeType === "string"
	) {
		// the selected node needs to be updated, since the name has changed
		store.dispatch(setSelectedNode(`["${nodeType}"]["${newName}"]`))
	}
}

export default builderSelectedeNodeMiddleware
