import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"
import { selectors } from "./adapter"

const useBuilderHasChanges = () =>
	useSelector(({ viewdef }: RuntimeState) => {
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
	useSelector((state: RuntimeState) => selectors.selectById(state, viewDefId))

export { useBuilderHasChanges, useViewDef }
