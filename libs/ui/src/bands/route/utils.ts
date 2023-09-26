import { platform } from "../../platform/platform"
import { Dependencies } from "./types"
import { setMany as setComponentVariant } from "../componentvariant"
import { setMany as setConfigValue } from "../configvalue"
import { setMany as setLabel } from "../label"
import { upsertMany as setViewDef } from "../viewdef"
import { setMany as setTheme } from "../theme"
import { setMany as setFeatureFlag } from "../featureflag"
import { setMany as setComponent } from "../component"
import { setMany as setComponentTypes } from "../componenttype"
import { initAll as initWire } from "../wire"
import { init as initCollection } from "../collection"
import { ViewMetadata } from "../../definition/ViewMetadata"
import { Context } from "../../context/context"
import { initExistingWire } from "../wire/operations/initialize"
import { ServerWire } from "../wire/types"
import { dispatch } from "../../store/store"
import { transformServerWire } from "../wire/transform"
import { getKey } from "../../metadata/metadata"
import { Bundleable } from "../../metadata/types"
import { ActionCreatorWithPayload } from "@reduxjs/toolkit"

const attachDefToWires = (wires?: ServerWire[], viewdefs?: ViewMetadata[]) => {
	if (!wires || !viewdefs) return wires
	return wires.map((wire) => {
		const viewId = wire.view.split("(")[0]
		const wireDef = viewdefs.find(
			(viewdef) => getKey(viewdef as Bundleable) === viewId
		)?.definition.wires?.[wire.name]
		if (!wireDef)
			throw new Error(
				`Could not find wire def for wire: ${wire.view} : ${wire.name}`
			)
		return initExistingWire(transformServerWire(wire), wireDef)
	})
}

const routeDepSetters = {
	collection: initCollection,
	component: setComponent,
	componenttype: setComponentTypes,
	componentvariant: setComponentVariant,
	configvalue: setConfigValue,
	featureflag: setFeatureFlag,
	label: setLabel,
	theme: setTheme,
	viewdef: setViewDef,
} as Record<keyof Dependencies, ActionCreatorWithPayload<unknown>>

const dispatchRouteDeps = (deps: Dependencies | undefined) => {
	if (!deps) return
	const { viewdef, wire } = deps
	Object.entries(routeDepSetters).forEach(([prop, setter]) => {
		const depState = deps[prop as keyof Dependencies]
		if (depState) {
			dispatch(setter(depState))
		}
	})
	// Special case - need both wire and viewdef to init wire state
	if (wire && viewdef) {
		dispatch(initWire(attachDefToWires(wire, viewdef) || []))
	}
}

const getPackUrlsForDeps = (
	deps: Dependencies | undefined,
	context: Context
) => {
	if (!deps?.componentpack) return []
	return deps.componentpack.map((pack) =>
		platform.getComponentPackURL(
			context,
			pack.namespace,
			pack.name,
			pack.updatedAt
		)
	)
}

export { dispatchRouteDeps, getPackUrlsForDeps, attachDefToWires }
