import { useSelector } from "react-redux"
import { selectors } from "."
import { RootState } from "../../store/store"

// Both gets component state and subscribes to component changes
const useComponentState = (
	componentType: string,
	componentId: string,
	viewId?: string
) =>
	useSelector((state: RootState) =>
		selectState(state, componentType, componentId, viewId)
	)

const selectState = (
	state: RootState,
	componentType: string,
	componentId: string,
	viewId?: string
) =>
	selectors.selectById(state, `${viewId}/${componentType}/${componentId}`)
		?.state

export { useComponentState, selectState }
