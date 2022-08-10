import { EntityId } from "@reduxjs/toolkit"
import { AnyAction } from "redux"
import { ThunkDispatch } from "redux-thunk"
import { parseVariantKey } from "../../component/path"
import { Platform } from "../../platform/platform"
import { RootState } from "../../store/store"
import { parse } from "../../yamlutils/yamlutils"
import { MetadataState } from "../metadata/types"
import { Dependencies } from "./types"
import { setMany as setComponentPack } from "../componentpack"
import { setMany as setComponentVariant } from "../componentvariant"
import { setMany as setConfigValue } from "../configvalue"
import { setMany as setLabel } from "../label"
import { setMany as setViewDef } from "../viewdef"

type EntityMap = Record<EntityId, MetadataState>

const dispatchRouteDeps = (
	deps: Dependencies | undefined,
	dispatch: ThunkDispatch<RootState, Platform, AnyAction>
) => {
	if (deps?.viewdef) {
		dispatch(setViewDef(deps?.viewdef.entities as EntityMap))
	}
	if (deps?.componentpack) {
		dispatch(setComponentPack(deps?.componentpack.entities as EntityMap))
	}
	if (deps?.configvalue) {
		dispatch(setConfigValue(deps?.configvalue.entities as EntityMap))
	}

	if (deps?.label) {
		dispatch(setLabel(deps?.label.entities as EntityMap))
	}

	if (deps?.componentvariant) {
		dispatch(
			setComponentVariant(deps?.componentvariant.entities as EntityMap)
		)
	}
}

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

			console.log({ viewDef })

			viewDef.original = viewDef.content
			//viewDef.parsed = parse(viewDef.content).toJSON()
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

export { parseRouteResponse, dispatchRouteDeps }
