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
		selectState<T>(state, componentType, componentId, viewId || "")
	)

const selectState = <T extends PlainComponentState>(
	state: RootState,
	componentType: string,
	componentId: string,
	viewId: string | undefined
) =>
	selectors.selectById(
		state,
		getComponentStateKey(componentType, componentId, viewId)
	)?.state as T | undefined

export { useComponentState, selectState }
