import { parseVariantKey } from "../../component/path"
import { parse } from "../../yamlutils/yamlutils"
import { MetadataState } from "../metadata/types"
import { Dependencies } from "./types"

const parseRouteResponse = (deps: Dependencies | undefined) => {
	if (!deps) return

	const componentVariantState = deps.componentvariant
	if (componentVariantState && componentVariantState.ids?.length) {
		componentVariantState.ids.forEach((id: string) => {
			const componentVariant = componentVariantState.entities[
				id
			] as MetadataState

			const [cns, cn, ns] = parseVariantKey(id)
			componentVariant.parsed = {
				...parse(componentVariant.content).toJSON(),
				component: cns + "." + cn,
				namespace: ns,
			}
		})
	}

	const viewDefState = deps.viewdef
	if (viewDefState && viewDefState.ids?.length) {
		viewDefState.ids.forEach((id: string) => {
			const viewDef = viewDefState.entities[id] as MetadataState
			viewDef.original = viewDef.content
			viewDef.parsed = parse(viewDef.content).toJSON()
		})
	}

	const themeState = deps.theme
	if (themeState && themeState.ids?.length) {
		themeState.ids.forEach((id: string) => {
			const theme = themeState.entities[id] as MetadataState
			theme.parsed = parse(theme.content).toJSON()
		})
	}
}

export { parseRouteResponse }
