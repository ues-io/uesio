import { Context } from "../../../context/context"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { runMany } from "../../../signals/signals"
import { getCurrentState } from "../../../store/store"
import { selectWire } from "../../wire"
import { useEffect, useRef } from "react"
import { ViewDefinition, ViewEventsDef } from "../../../definition/viewdef"

const runEvents = async (
	events: ViewEventsDef | undefined,
	context: Context
) => {
	// Handle Events
	const onloadEvents = events?.onload
	if (onloadEvents) {
		await runMany(onloadEvents, context)
	}
}

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

	if (!viewDef) throw new Error("Could not get View Def")

	const params = context.getParams()
	const wires = viewDef.wires
	const events = viewDef.events

	// Keeps track of the value of wires from the previous render
	const prevWires = usePrevious(wires)

	useEffect(() => {
		;(async () => {
			if (!wires) return
			const wireNames = Object.keys(wires)
			if (!wireNames.length) return
			const state = getCurrentState()

			const viewId = context.getViewId()

			const wiresToInit = Object.fromEntries(
				wireNames.flatMap((wirename) => {
					const wireDef = wires[wirename]
					const foundWire = selectWire(state, viewId, wirename)
					return foundWire ? [] : [[wirename, wireDef]]
				})
			)

			if (Object.keys(wiresToInit).length) {
				initializeWiresOp(context, wiresToInit)
			}

			if (wireNames.length) {
				await loadWiresOp(context, wireNames)
			}
			await runEvents(events, context)
		})()
	}, [viewDefId, JSON.stringify(params)])

	useEffect(() => {
		;(async () => {
			if (!wires || !prevWires) return
			const changedWires = Object.entries(wires).flatMap(
				([wirename, wire]) => {
					const prev = prevWires[wirename]
					if (!prev) return [wirename]
					if (JSON.stringify(wire) !== JSON.stringify(prev))
						return [wirename]
					return []
				}
			)
			if (!changedWires.length) return
			const wiresToInit = Object.fromEntries(
				changedWires.flatMap((wirename) => [
					[wirename, wires[wirename]],
				])
			)
			initializeWiresOp(context, wiresToInit)
			await loadWiresOp(context, changedWires)
		})()
	}, [JSON.stringify(wires)])
}

export { useLoadWires }
