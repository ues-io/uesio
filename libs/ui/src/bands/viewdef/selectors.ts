import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"

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

export { useBuilderHasChanges }
