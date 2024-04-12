import { useSelector } from "react-redux"
import { selectors } from "."
import { RootState } from "../../store/store"
import { ComponentState, PlainComponentState } from "./types"

// Both gets component state and subscribes to component changes
const useComponentState = <T extends PlainComponentState>(
	componentId: string
) => useSelector((state: RootState) => selectState<T>(state, componentId))

const useComponentStates = (target: string) =>
	useSelector((state: RootState) => selectTarget(state, target))

const useComponentStatesCount = (target: string) =>
	useSelector((state: RootState) => selectTargetCount(state, target))

const useComponentEntity = (componentId: string) =>
	useSelector((state: RootState) => selectEntity(state, componentId))

const selectState = <T extends PlainComponentState>(
	state: RootState,
	componentId: string
) => selectors.selectById(state, componentId)?.state as T | undefined

const selectEntity = (state: RootState, componentId: string) =>
	selectors.selectById(state, componentId)

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

const selectTargetCount = (state: RootState, target: string) => {
	const entities = selectors.selectEntities(state)
	if (!entities) return 0
	return Object.keys(entities).filter(
		(k) => k.startsWith(target) && entities[k]
	).length
}

export {
	useComponentState,
	useComponentEntity,
	useComponentStates,
	selectState,
	selectEntity,
	selectTarget,
	useComponentStatesCount,
}
