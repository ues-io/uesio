/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import toPath from "lodash.topath"
import { AnyAction } from "redux"

const builderActiveNodeMiddleware = (store: any) => (
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
		actionType === "viewdef/changeDefinitionKey" &&
		nodeType &&
		typeof nodeType === "string"
	) {
		// the selected node needs to be updated, since the name has changed
		store.dispatch({
			type: "builder/setSelectedNode",
			payload: `["${nodeType}"]["${newName}"]`,
		})
	}
}

export default builderActiveNodeMiddleware
