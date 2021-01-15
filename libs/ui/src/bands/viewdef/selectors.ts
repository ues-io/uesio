import get from "lodash.get"
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

const useViewDef = (viewDefId: string) =>
	useSelector((state: RootState) => selectors.selectById(state, viewDefId))

const useViewDefinition = (viewDefId: string, path?: string): Definition =>
	useSelector((state: RootState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		const definition = viewDef?.definition
		return path ? get(definition, path || "") : definition
	})

const useViewYAML = (viewDefId: string) =>
	useSelector((state: RootState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		return viewDef?.yaml
	})

const useViewConfigValue = (viewDefId: string, key: string) =>
	useSelector((state: RootState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		return viewDef?.dependencies?.configvalues[key] || ""
	})

export {
	useBuilderHasChanges,
	useViewDef,
	useViewYAML,
	useViewDefinition,
	useViewConfigValue,
}
