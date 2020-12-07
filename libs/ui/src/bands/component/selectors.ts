import { useSelector } from "react-redux"
import { selectors } from "."
import RuntimeState from "../../store/types/runtimestate"

// Both gets component state and subscribes to component changes
const useComponentState = (
	componentType: string,
	componentId: string,
	viewId?: string
) =>
	useSelector((state: RuntimeState) =>
		selectState(state, componentType, componentId, viewId)
	)

const selectState = (
	state: RuntimeState,
	componentType: string,
	componentId: string,
	viewId?: string
) =>
	selectors.selectById(state, `${viewId}/${componentType}/${componentId}`)
		?.state

export { useComponentState, selectState }
