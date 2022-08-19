import { Context } from "../../../context/context"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { runMany } from "../../../signals/signals"
import { ThunkFunc } from "../../../store/store"
import { selectWire } from "../../wire"
import { selectors as viewSelectors } from "../../viewdef"
import { dispatchRouteDeps } from "../../route/utils"

const fetchView =
	(context: Context, viewDefId: string): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const state = getState()
		const viewDef = viewSelectors.selectById(state, viewDefId)
		if (!viewDef) {
			const deps = await platform.getBuilderDeps(context)
			if (!deps) throw new Error("Could not get View Def")
			dispatchRouteDeps(deps, dispatch)
		}
		return context
	}

export default (context: Context): ThunkFunc =>
	async (dispatch, getState) => {
		// First check to see if we have the viewDef
		const viewDefId = context.getViewDefId()
		if (!viewDefId) throw new Error("No View Def Context Provided")

		if (context.getBuildMode()) {
			await dispatch(fetchView(context, viewDefId))
		}

		const state = getState()
		const viewDef = viewSelectors.selectById(state, viewDefId)

		if (!viewDef) throw new Error("Could not get View Def")

		const definition = viewDef.definition
		const wires = definition.wires || {}

		const wiresToInit = Object.fromEntries(
			Object.entries(wires).filter(
				([wirename]) =>
					!selectWire(state, context.getViewId(), wirename)
			)
		)

		const wiresToInitNames = wires ? Object.keys(wiresToInit) : []

		if (wiresToInitNames?.length) {
			// Initialize Wires
			dispatch(initializeWiresOp(context, wiresToInit))
			await dispatch(loadWiresOp(context, wiresToInitNames))
		}

		// Handle Events
		const onloadEvents = definition.events?.onload
		if (onloadEvents) {
			await runMany(onloadEvents, context)
		}

		return context
	}
