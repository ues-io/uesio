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
import { Component } from "../../definition/component"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { LabelState } from "../../definition/label"
import { Context } from "../../context/context"
import { parseKey } from "../../component/path"
import { ThemeState } from "../../definition/theme"
import { FeatureFlagState } from "../../definition/featureflag"
import { initExistingWire } from "../wire/operations/initialize"
import { EntityId, EntityState } from "@reduxjs/toolkit"
import { PlainWire, ServerWire } from "../wire/types"
import { dispatch } from "../../store/store"
import { ComponentState } from "../component/types"
import { transformServerWire } from "../wire/transform"

type Dep<T> = Record<string, T> | undefined

const attachDefToWires = (
	wires?: EntityState<ServerWire | PlainWire>,
	viewdefs?: EntityState<ViewMetadata>
) => {
	if (!wires || !viewdefs) return wires
	wires.ids.forEach((wirename: EntityId) => {
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
			transformServerWire(wire as ServerWire),
			wireDef
		)
	})
}

const dispatchRouteDeps = (deps: Dependencies | undefined) => {
	if (!deps) return

	const viewdefs = deps.viewdef?.entities as Dep<ViewMetadata>
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

	const componentTypes = deps.componenttype?.entities as Dep<Component>
	if (componentTypes) dispatch(setComponentTypes(componentTypes))

	const wires = deps.wire
	if (wires && viewdefs) {
		attachDefToWires(wires, deps.viewdef)
		dispatch(initWire(wires))
	}

	const collections = deps.collection
	if (collections) dispatch(initCollection(collections))
}

const getPackUrlsForDeps = (
	deps: Dependencies | undefined,
	context: Context
) => {
	if (!deps?.componentpack) return []
	const { ids, entities } = deps.componentpack
	return ids.map((key) => {
		const [namespace, name] = parseKey(key as string)
		const entity = entities[key]
		return platform.getComponentPackURL(
			context,
			namespace,
			name,
			entity?.updatedAt
		)
	})
}

export { dispatchRouteDeps, getPackUrlsForDeps, attachDefToWires }
