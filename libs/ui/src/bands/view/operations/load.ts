import { Context } from "../../../context/context"
import loadWiresOp, { getParamsHash } from "../../wire/operations/load"
import initializeWiresOp, {
	getDefinitionHash,
} from "../../wire/operations/initialize"
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

	const viewParamsHash = getParamsHash(context)
	const viewId = context.getViewId()
	const hasRunEvents = useRef(false)

	useEffect(() => {
		;(async () => {
			if (!wires) return
			const wireNames = Object.keys(wires)
			if (!wireNames.length) return
			const state = getCurrentState()

			const wiresToInit: Record<string, WireDefinition> = {}
			const wiresToLoad: string[] = []

			for (const wireName in wires) {
				const wireDef = wires[wireName]
				const foundWire = selectWire(state, viewId, wireName)

				// If we don't have the wire in redux, then we have to both
				// initialize and load the wire
				if (!foundWire) {
					wiresToInit[wireName] = wireDef
					wiresToLoad.push(wireName)
					continue
				}

				// If the definition of our wire has changed, re-initialize and reload it
				if (getDefinitionHash(wireDef) !== foundWire.definitionHash) {
					wiresToInit[wireName] = wireDef
					wiresToLoad.push(wireName)
					continue
				}

				// If the wire exists in redux, but has no params hash
				// that means it's never been loaded and needs to be.
				const wireParamsHash = foundWire.paramsHash
				if (!wireParamsHash) {
					wiresToLoad.push(wireName)
					continue
				}

				const paramsHaveChanged = viewParamsHash !== wireParamsHash
				if (
					paramsHaveChanged &&
					wireHasParamsThatHaveChanged(wireDef, context.getParams())
				) {
					wiresToLoad.push(wireName)
				}
			}

			if (Object.keys(wiresToInit).length) {
				initializeWiresOp(context, wiresToInit)
			}

			if (wiresToLoad.length) {
				await loadWiresOp(context, Array.from(wiresToLoad.values()))
			}

			if (!hasRunEvents.current) {
				hasRunEvents.current = true
				await runEvents(events, context)
			}
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [route.batchid, viewDefId, wires, viewParamsHash])
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
