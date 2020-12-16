import { useSelector } from "react-redux"
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

const useViewDef = (viewDefId: string) =>
	useSelector((state: RootState) => selectors.selectById(state, viewDefId))

export { useBuilderHasChanges, useViewDef }
