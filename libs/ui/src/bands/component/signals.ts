import produce from "immer"
import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { getCurrentState, dispatch } from "../../store/store"
import { selectTarget } from "./selectors"
import { set as setComponent } from "../component"
import { batch } from "react-redux"
import { platform } from "../../platform/platform"
import { makeComponentId } from "../../hooks/componentapi"

interface ComponentSignal extends SignalDefinition {
	target?: string
}

export default {
	dispatcher: (signal: ComponentSignal, context: Context) => {
		const { target: signalTarget, signal: signalName } = signal
		const [band, owner, component, type] = signalName.split("/")
		if (band !== "component" || (!owner && !component) || !type)
			return context

		const scope = `${owner}/${component}`
		const handler = getSignal(scope, type)
		if (!handler) {
			throw new Error(
				`Missing handler for componentsgnal. "${scope}" has no signal of type "${type}"`
			)
		}

		const target = signalTarget || handler.target || ""
		const state = getCurrentState()

		// This is where we select state based on even partial target ids
		const targetSearch = makeComponentId(context, scope, target)

		let componentStates = selectTarget(state, targetSearch)

		// If we couldn't find targets in our record context, try without it.
		if (!componentStates.length) {
			const targetSearch = makeComponentId(context, scope, target, true)
			componentStates = selectTarget(state, targetSearch)
		}

		// If we still can't find a target, we'll need to create entirely new state
		if (!componentStates.length) {
			componentStates = [{ id: targetSearch, state: {} }]
		}

		// Loop over all ids that match the target and dispatch
		// to them all
		batch(() => {
			componentStates.forEach((componentState) => {
				dispatch(
					setComponent({
						id: componentState.id,
						state: produce(componentState.state, (draft) =>
							handler.dispatcher(draft, signal, context, platform)
						),
					})
				)
			})
		})

		return context
	},
}
