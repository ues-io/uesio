import produce from "immer"
import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { ThunkFunc } from "../../store/store"
import { selectTarget } from "./selectors"
import { makeComponentId, set as setComponent } from "../component"
import { batch } from "react-redux"

interface ComponentSignal extends SignalDefinition {
	target?: string
}

export default {
	dispatcher:
		(signal: ComponentSignal, context: Context): ThunkFunc =>
		(dispatch, getState, platform) => {
			const { target: signalTarget, signal: signalName } = signal
			const [band, owner, component, type] = signalName.split("/")
			if (band !== "component" || (!owner && !component) || !type)
				return context

			const scope = `${owner}/${component}`
			const handler = getSignal(scope, type)

			const target = signalTarget || handler.target || ""

			// This is where we select state based on even partial target ids
			const targetSearch = makeComponentId(context, scope, target)

			const componentStates = selectTarget(getState(), targetSearch)

			// Loop over all ids that match the target and dispatch
			// to them all
			batch(() => {
				componentStates.forEach((componentState) => {
					dispatch(
						setComponent({
							id: componentState.id,
							state: produce(componentState.state, (draft) =>
								handler.dispatcher(
									draft,
									signal,
									context,
									platform
								)
							),
						})
					)
				})
			})

			return context
		},
}
