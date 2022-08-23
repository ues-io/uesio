import { useSelector } from "react-redux"
import { selectors } from "."
import { RootState } from "../../store/store"
import { ComponentState, PlainComponentState } from "./types"

// Both gets component state and subscribes to component changes
const useComponentState = <T extends PlainComponentState>(
	componentId: string
) => useSelector((state: RootState) => selectState<T>(state, componentId))

const selectState = <T extends PlainComponentState>(
	state: RootState,
	componentId: string
) => selectors.selectById(state, componentId)?.state as T | undefined

const selectTarget = (state: RootState, target: string) => {
	const matches: ComponentState[] = []
	const entities = selectors.selectEntities(state)
	if (!entities) return matches
	Object.keys(entities).forEach((key) => {
		if (key.startsWith(target)) {
			const componentState = entities[key]
			if (componentState) {
				matches.push(componentState)
			}
		}
	})
	return matches
}

export { useComponentState, selectState, selectTarget }
