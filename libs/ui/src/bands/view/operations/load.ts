import { Context } from "../../../context/context"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { runMany } from "../../../signals/signals"
import { getCurrentState } from "../../../store/store"
import { selectWire } from "../../wire"
import { useEffect } from "react"
import { ViewDefinition } from "../../../definition/viewdef"

const useLoadWires = (
	context: Context,
	viewDef: ViewDefinition | undefined
) => {
	const viewDefId = context.getViewDefId()
	if (!viewDefId) throw new Error("No View Def Context Provided")

	if (!viewDef) throw new Error("Could not get View Def")

	const params = context.getParams()

	useEffect(() => {
		;(async () => {
			const wires = viewDef.wires || {}
			const wireNames = Object.keys(wires)
			if (!wireNames.length) return
			const state = getCurrentState()

			const viewId = context.getViewId()

			const wiresToInit = Object.fromEntries(
				Object.entries(wires).flatMap(([wirename, wireDef]) => {
					const foundWire = selectWire(state, viewId, wirename)
					return foundWire ? [] : [[wirename, wireDef]]
				})
			)

			if (Object.keys(wiresToInit).length) {
				initializeWiresOp(context, wiresToInit)
			}

			const wiresToLoad = Object.fromEntries(
				Object.entries(wires).flatMap(([wirename, wireDef]) => [
					[wirename, wireDef],
				])
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
	}, [viewDefId, JSON.stringify(params)])
}

export { useLoadWires }
