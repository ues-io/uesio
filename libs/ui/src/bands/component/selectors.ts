import { useSelector } from "react-redux"
import { getComponentStateKey, selectors } from "."
import { RootState } from "../../store/store"
import { PlainComponentState } from "./types"

// Both gets component state and subscribes to component changes
const useComponentState = <T extends PlainComponentState>(
	componentType: string,
	componentId: string,
	viewId: string | undefined
) =>
	useSelector((state: RootState) =>
		selectComponent<T>(state, componentType, componentId, viewId || "")
	)

const selectComponent = <T extends PlainComponentState>(
	state: RootState,
	componentType: string,
	componentId: string,
	viewId: string | undefined
) =>
	selectors.selectById(
		state,
		getComponentStateKey(componentType, componentId, viewId)
	)?.state as T | undefined

const selectComponentsByTarget = (state: RootState, componentId: string) => [
	...selectors
		.selectAll(state)
		.filter((el) => el.id && el.id.startsWith(componentId)),
]

export { useComponentState, selectComponent, selectComponentsByTarget }
