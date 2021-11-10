import get from "lodash/get"
import { useSelector } from "react-redux"
import { Definition } from "../../definition/definition"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

const useBuilderHasChanges = () =>
	useSelector(({ viewdef }: RootState) => {
		const entities = viewdef?.entities
		// Loop over view defs
		if (entities) {
			for (const defKey of Object.keys(entities)) {
				const viewDef = entities[defKey]
				if (viewDef && viewDef.yaml !== viewDef.originalYaml) {
					return true
				}
			}
		}
		return false
	})

// const useViewDef = (viewDefId: string) =>
// 	useSelector((state: RootState) => selectors.selectById(state, viewDefId))

// const useViewDefinition = (viewDefId: string, path?: string): Definition =>
// 	useSelector((state: RootState) => getViewDefinition(state, viewDefId, path))

const getComponentVariantDef = (
	state: RootState,
	componentVariantDef: string,
	path?: string
): Definition => {
	const ComponentVariantDef = selectors.selectById(state, componentVariantDef)
	const definition = ComponentVariantDef?.definition
	return path ? get(definition, path || "") : definition
}

export {
	useBuilderHasChanges,
	// useViewDef,
	// useViewDefinition,
	getComponentVariantDef,
}
