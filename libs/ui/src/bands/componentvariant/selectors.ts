import get from "lodash/get"
import { useSelector } from "react-redux"
import { Definition } from "../../definition/definition"
import { RootState } from "../../store/store"
import { selectors, selectEntities } from "./adapter"

const useBuilderHasChangesCV = () =>
	useSelector(({ componentvariant }: RootState) => {
		const entities = componentvariant?.entities
		// Loop over view defs
		if (entities) {
			for (const defKey of Object.keys(entities)) {
				const componentvariant = entities[defKey]
				if (
					componentvariant &&
					componentvariant.yaml !== componentvariant.originalYaml
				) {
					console.log("THIS returns true")
					return true
				}
			}
		}
		console.log("THIS returns false")
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

export { useBuilderHasChangesCV, getComponentVariant, useAllVariants }
