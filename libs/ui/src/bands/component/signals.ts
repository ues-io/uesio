import produce from "immer"
import { getSignal } from "../../component/registry"
import { Context, isContextObject } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { getCurrentState, dispatch } from "../../store/store"
import { selectTarget } from "./selectors"
import { set as setComponent } from "../component"
import { batch } from "react-redux"
import { platform } from "../../platform/platform"
import { makeComponentId } from "../../hooks/componentapi"

interface ComponentSignal extends SignalDefinition {
	component: string
	componentsignal: string
	targettype: "specific" | "multiple"
	target?: string
	componentid?: string
}

const getComponentSignalDefinition = () => ({
	dispatcher: (signal: ComponentSignal, context: Context) => {
		const {
			target: signalTarget,
			signal: signalName,
			componentid,
			targettype,
		} = signal
		const [band, ...rest] = signalName.split("/")

		if (band !== "component") return context

		let componentSignal = ""
		let componentType = ""

		// New syntax - signal specified via separate properties, e.g.
		// { signal: "component/CALL", component: "uesio/io.list", componentsignal: "TOGGLE_MODE" }
		if (rest.length === 1 && rest[0] === "CALL") {
			componentType = signal.component
			componentSignal = signal.componentsignal
		} else if (rest.length === 3) {
			// Old syntax - component type and component-specific signal embedded in the signal name,
			// e.g. { signal: "component/uesio/io.list/TOGGLE_MODE" }
			componentType = `${rest[0]}/${rest[1]}`
			componentSignal = rest[2]
		}

		if (!componentType) {
			throw new Error("No component type selected for component signal")
		}
		if (!componentSignal) {
			throw new Error("No component signal selected")
		}

		const handler = getSignal(componentType, componentSignal)
		if (!handler) {
			throw new Error(
				`Missing handler for component signal. "${componentType}" has no signal "${componentSignal}"`
			)
		}

		const target =
			(targettype === "specific"
				? componentid
				: signalTarget || handler.target) || ""
		const state = getCurrentState()

		// This is where we select state based on even partial target ids
		const targetSearch = makeComponentId(context, componentType, target)

		let componentStates = selectTarget(state, targetSearch)

		// If we couldn't find targets in our record context, try without it.
		if (!componentStates.length) {
			const targetSearch = makeComponentId(
				context,
				componentType,
				target,
				true
			)
			componentStates = selectTarget(state, targetSearch)

			// If we still can't find a target, we'll need to create entirely new state
			if (!componentStates.length) {
				componentStates = [{ id: targetSearch, state: {} }]
			}
		}

		// Loop over all ids that match the target and dispatch
		// to them all
		batch(() => {
			componentStates.forEach((componentState) => {
				dispatch(
					setComponent({
						id: componentState.id,
						state: produce(componentState.state, (draft) => {
							const returnvalue = handler.dispatcher(
								draft,
								signal,
								context,
								platform,
								componentState.id
							)
							// If we returned a context object from our dispatcher,
							// That means we want to set it as the new context.
							if (isContextObject(returnvalue)) {
								context = returnvalue
								return
							}
							return returnvalue
						}),
					})
				)
			})
		})

		return context
	},
})

export { getComponentSignalDefinition }
