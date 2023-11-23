import { Context } from "../../../context/context"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { runMany } from "../../../signals/signals"
import { getCurrentState } from "../../../store/store"
import { selectWire } from "../../wire"
import { useEffect, useRef } from "react"
import { ViewEventsDef } from "../../../definition/view"
import { ViewDefinition } from "../../../definition/ViewDefinition"
import { RegularWireDefinition, WireDefinition } from "../../../definition/wire"
import { WireConditionState } from "../../wire/conditions/conditions"

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

	const route = context.getRoute()
	if (!route) throw new Error("No Route in Context for View Load")

	const { wires, events } = viewDef

	// Keeps track of the value of wires from the previous render
	const prevWires = usePrevious(wires)
	const prevRoute = usePrevious(route.path)
	const prevParams = usePrevious(context.getParams())

	useEffect(() => {
		;(async () => {
			if (wires) {
				const wireNames = Object.keys(wires)
				if (!wireNames.length) return
				const state = getCurrentState()

				const viewId = context.getViewId()

				// Only initialize wires that don't already exist in our redux store.
				// This filters out our pre-loaded wires so they aren't initialized twice.
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
			}
			await runEvents(events, context)
		})()
		// TODO: There is probably a better way to check than JSON.stringify() on params.
		// consider useDeepCompareEffect(), or memoization
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [route.batchid, viewDefId])

	useEffect(() => {
		;(async () => {
			if (!wires || !prevWires) return
			if (prevRoute !== route.path) return

			// This filters out any wires whose definition did not change since the
			// last time this hook was run. That way we only re-initialize and load
			// wires that need it.
			const changedWires = Object.entries(wires).flatMap(
				([wirename, wire]) => {
					const prev = prevWires[wirename]
					if (!prev) return [wirename]
					if (JSON.stringify(wire) !== JSON.stringify(prev))
						return [wirename]
					return []
				}
			)
			const newParams = context.getParams()
			const paramsHaveChanged =
				JSON.stringify(newParams) !== JSON.stringify(prevParams)

			// We also need to update any wires with Conditions / Defaults params have changed
			const wiresWithUpdatedParams = paramsHaveChanged
				? Object.entries(wires).flatMap(([wirename, wire]) =>
						wireHasParamsThatHaveChanged(wire, newParams)
							? [wirename]
							: []
				  )
				: []
			if (!changedWires.length && !wiresWithUpdatedParams.length) return
			if (changedWires.length) {
				const wiresToInit = Object.fromEntries(
					changedWires.map((wirename) => [wirename, wires[wirename]])
				)
				initializeWiresOp(context, wiresToInit)
			}
			const wiresToLoad = new Set(
				changedWires.concat(wiresWithUpdatedParams)
			)
			await loadWiresOp(context, Array.from(wiresToLoad.values()))
		})()
	}, [wires, prevWires, route.path, prevRoute, prevParams, context])
}

const wireHasParamsThatHaveChanged = (
	wire: WireDefinition,
	params?: Record<string, string>
) => {
	const { viewOnly = false } = wire
	if (viewOnly || !params) return false
	const conditions = (wire as RegularWireDefinition).conditions
	if (!conditions || !conditions.length) return false
	return conditions?.some((condition) =>
		doesConditionHaveParamDependency(condition, params)
	)
}

const doesConditionHaveParamDependency = (
	condition: WireConditionState,
	params: Record<string, string>
): boolean => {
	if (
		condition.valueSource === "PARAM" &&
		condition.param &&
		condition.param in params
	) {
		return true
	}
	if (
		(condition.type === "GROUP" || condition.type === "SUBQUERY") &&
		condition.conditions &&
		condition.conditions?.length
	) {
		return condition.conditions.some((c) =>
			doesConditionHaveParamDependency(c, params)
		)
	}
	return false
}

export { useLoadWires }
