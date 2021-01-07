import { AnyAction } from "redux"
import toPath from "lodash.topath"
import { changeDefinitionKey } from "../../../src/bands/viewdef"
import { setSelectedNode } from "../../../src/bands/builder"

// due to circular dependency upon import of RootState, type as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const builderSelectedeNodeMiddleware = (store: any) => (
	next: (action: AnyAction) => void
) => (action: AnyAction) => {
	const actionType = action?.type
	const currentSelectedNode = store.getState()?.builder?.selectedNode
	const newName = action?.payload?.key
	const currentPath = action?.payload?.path
	const [nodeType] = toPath(action?.payload?.path) // nodeType is for example wires

	console.log("action?.payload?.path", action?.payload?.path)
	console.log("currentSelectedNode", currentSelectedNode)

	// dispatch to reducer
	next(action)
	// from here on, the store has been updated

	if (
		currentSelectedNode === currentPath &&
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
