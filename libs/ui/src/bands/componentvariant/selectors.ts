import get from "lodash/get"
import { useSelector } from "react-redux"
import { Definition } from "../../definition/definition"
import { RootState } from "../../store/store"
import { selectors, selectEntities } from "./adapter"

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

const useAllVariants = () =>
	useSelector((state: RootState) => selectEntities(state))

const getComponentVariant = (
	state: RootState,
	componentVariantDef: string,
	path?: string
): Definition => {
	const ComponentVariant = selectors.selectById(state, componentVariantDef)
	const definition = ComponentVariant?.definition
	return path ? get(definition, path || "") : definition
}

export { useBuilderHasChanges, getComponentVariant, useAllVariants }
