import { Context } from "../../../context/context"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { runMany } from "../../../signals/signals"
import { ThunkFunc } from "../../../store/store"
import { selectWire } from "../../wire"
import { selectors as viewSelectors } from "../../viewdef"
import { dispatchRouteDeps } from "../../route/utils"

export default (context: Context): ThunkFunc =>
	async (dispatch, getState, platform) => {
		// First check to see if we have the viewDef
		const viewDefId = context.getViewDefId()
		if (!viewDefId) throw new Error("No View Def Context Provided")

		if (context.getBuildMode()) {
			const viewDef = viewSelectors.selectById(getState(), viewDefId)
			if (!viewDef) {
				const deps = await platform.getBuilderDeps(context)
				if (!deps) throw new Error("Could not get View Def")
				dispatchRouteDeps(deps, dispatch)
			}
		}

		const state = getState()
		const viewDef = viewSelectors.selectById(state, viewDefId)

		if (!viewDef) throw new Error("Could not get View Def")

		const definition = viewDef.definition
		const wires = definition.wires || {}
		const viewId = context.getViewId()
		const wireNames = Object.keys(wires)

		const wiresToInit = Object.fromEntries(
			Object.entries(wires).flatMap(([wirename, wireDef]) => {
				const foundWire = selectWire(state, viewId, wirename)
				return foundWire ? [] : [[wirename, wireDef]]
			})
		)

		if (Object.keys(wiresToInit).length) {
			dispatch(initializeWiresOp(context, wiresToInit))
		}

		if (wireNames.length) {
			await dispatch(loadWiresOp(context, wireNames))
		}

		// Handle Events
		const onloadEvents = definition.events?.onload
		if (onloadEvents) {
			await runMany(onloadEvents, context)
		}

		return context
	}
