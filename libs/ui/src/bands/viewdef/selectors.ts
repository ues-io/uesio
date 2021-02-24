import get from "lodash.get"
import { useSelector } from "react-redux"
import { Definition } from "../../definition/definition"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"
import { ComponentVariant } from "./types"
import { styles } from "@uesio/ui"

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
const useComponentVariant = (
	viewDefId: string,
	componentVariantKey: string,
	theme: styles.Theme
): ComponentVariant | undefined =>
	useSelector((state: RootState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		const variant =
			viewDef?.dependencies?.componentvariants?.[componentVariantKey]
		console.log(theme)
		return variant
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
	useComponentVariant,
	useViewDef,
	useViewYAML,
	useViewDefinition,
	useViewConfigValue,
}
