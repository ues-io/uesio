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
	const newKey = action?.payload?.key
	const oldPath = action?.payload?.path
	const [nodeType] = toPath(oldPath) // nodeType is for example wires

	// dispatch to reducer
	next(action)
	// from here on, the store has been updated

	if (
		currentSelectedNode === oldPath &&
		newKey &&
		actionType === `${changeDefinitionKey}` &&
		nodeType &&
		typeof nodeType === "string"
	) {
		// the selected node needs to be updated, since the name has changed
		store.dispatch(setSelectedNode(`["${nodeType}"]["${newKey}"]`))
	}
}

export default builderSelectedeNodeMiddleware
