import { platform } from "../../platform/platform"
import { Dependencies } from "./types"
import { setMany as setComponentVariant } from "../componentvariant"
import { setMany as setConfigValue } from "../configvalue"
import { setMany as setLabel } from "../label"
import { setMany as setViewDef } from "../viewdef"
import { setMany as setTheme } from "../theme"
import { setMany as setMetadataText } from "../metadatatext"
import { setMany as setFeatureFlag } from "../featureflag"
import { setMany as setComponent } from "../component"
import { initAll as initWire } from "../wire"
import { init as initCollection } from "../collection"
import { PlainViewDef } from "../../definition/viewdef"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { LabelState } from "../../definition/label"
import { Context } from "../../context/context"
import { parseKey } from "../../component/path"
import { ThemeState } from "../../definition/theme"
import { MetadataState } from "../metadata/types"
import { FeatureFlagState } from "../../definition/featureflag"
import { initExistingWire } from "../wire/operations/initialize"
import { EntityState } from "@reduxjs/toolkit"
import { PlainWire } from "../wire/types"
import { dispatch } from "../../store/store"
import { ComponentState } from "../component/types"
import { PlainCollection, PlainCollectionMap } from "../collection/types"

type Dep<T> = Record<string, T> | undefined

const attachDefToWires = (
	wires?: EntityState<PlainWire>,
	viewdefs?: EntityState<PlainViewDef>,
	collections?: EntityState<PlainCollection>
) => {
	if (!wires || !viewdefs) return
	wires.ids.forEach((wirename) => {
		const wire = wires.entities[wirename]
		if (!wire) return

		const viewId = wire.view.split("(")[0]
		const wireDef =
			viewdefs.entities?.[viewId]?.definition.wires?.[wire.name]
		if (!wireDef)
			throw new Error(
				`Could not find wire def for wire: ${wire.view} : ${wire.name}`
			)
		wires.entities[wirename] = initExistingWire(
			wire,
			wireDef,
			(collections?.entities || {}) as PlainCollectionMap
		)
	})
}

const dispatchRouteDeps = (deps: Dependencies | undefined) => {
	if (!deps) return

	const viewdefs = deps.viewdef?.entities as Dep<PlainViewDef>
	if (viewdefs) dispatch(setViewDef(viewdefs))

	const configvalues = deps.configvalue?.entities as Dep<ConfigValueState>
	if (configvalues) dispatch(setConfigValue(configvalues))

	const featureflags = deps.featureflag?.entities as Dep<FeatureFlagState>
	if (featureflags) dispatch(setFeatureFlag(featureflags))

	const labels = deps.label?.entities as Dep<LabelState>
	if (labels) dispatch(setLabel(labels))

	const variants = deps.componentvariant?.entities as Dep<ComponentVariant>
	if (variants) dispatch(setComponentVariant(variants))

	const themes = deps.theme?.entities as Dep<ThemeState>
	if (themes) dispatch(setTheme(themes))

	const components = deps.component?.entities as Dep<ComponentState>
	if (components) dispatch(setComponent(components))

	const metadatatext = deps.metadatatext?.entities as Dep<MetadataState>
	if (metadatatext) dispatch(setMetadataText(metadatatext))

	const wires = deps.wire
	if (wires && viewdefs) {
		attachDefToWires(wires, deps.viewdef, deps.collection)
		dispatch(initWire(wires))
	}

	const collections = deps.collection
	if (collections) dispatch(initCollection(collections))
}

const getPackUrlsForDeps = (deps: Dependencies | undefined, context: Context) =>
	deps?.componentpack?.ids.map((key) => {
		const [namespace, name] = parseKey(key as string)
		return platform.getComponentPackURL(context, namespace, name)
	}) || []

export { dispatchRouteDeps, getPackUrlsForDeps, attachDefToWires }
