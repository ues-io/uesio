import { Context } from "../../../context/context"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { runMany } from "../../../signals/signals"
import { getCurrentState } from "../../../store/store"
import { selectWire } from "../../wire"
import { dispatchRouteDeps } from "../../route/utils"
import { batch } from "react-redux"
import { useEffect, useRef } from "react"
import { ViewDefinition } from "../../../definition/viewdef"
import { platform } from "../../../platform/platform"

const usePrevious = <T>(value: T): T | undefined => {
	const ref = useRef<T>()
	useEffect(() => {
		ref.current = value
	})
	return ref.current
}

const useLoadWires = (
	context: Context,
	viewDef: ViewDefinition | undefined
) => {
	const viewDefId = context.getViewDefId()
	if (!viewDefId) throw new Error("No View Def Context Provided")

	useEffect(() => {
		;(async () => {
			if (context.getBuildMode()) {
				if (!viewDef) {
					const deps = await platform.getBuilderDeps(context)
					if (!deps) throw new Error("Could not get View Def")
					batch(() => {
						dispatchRouteDeps(deps)
					})
				}
			}
		})()
	}, [viewDefId])

	if (!viewDef) throw new Error("Could not get View Def")

	const params = context.getParams()

	const oldParams = usePrevious(params)
	const oldWires = usePrevious(viewDef.wires)

	useEffect(() => {
		;(async () => {
			const wires = viewDef.wires || {}
			const wireNames = Object.keys(wires)
			if (!wireNames.length) return
			const state = getCurrentState()

			const paramsChanged = oldParams !== params

			const viewId = context.getViewId()

			const wiresToInit = Object.fromEntries(
				Object.entries(wires).flatMap(([wirename, wireDef]) => {
					const foundWire = selectWire(state, viewId, wirename)
					const isPreloaded = foundWire?.preloaded
					const isUnchanged =
						!paramsChanged && wireDef === oldWires?.[wirename]
					return isPreloaded || isUnchanged
						? []
						: [[wirename, wireDef]]
				})
			)

			if (Object.keys(wiresToInit).length) {
				initializeWiresOp(context, wiresToInit)
			}

			const wiresToLoad = Object.fromEntries(
				Object.entries(wires).flatMap(([wirename, wireDef]) => {
					const isUnchanged =
						!paramsChanged && wireDef === oldWires?.[wirename]
					return isUnchanged ? [] : [[wirename, wireDef]]
				})
			)

			if (Object.keys(wiresToLoad).length) {
				await loadWiresOp(context, Object.keys(wiresToLoad))
			}

			// Handle Events
			const onloadEvents = viewDef.events?.onload
			if (onloadEvents) {
				await runMany(onloadEvents, context)
			}
		})()
	}, [viewDefId, JSON.stringify(params), viewDef.wires])
}

export { useLoadWires }
