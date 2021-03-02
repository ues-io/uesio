import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { ThunkFunc } from "../../store/store"
import { selectState } from "./selectors"
import { PlainComponentState } from "./types"

interface ComponentSignal extends SignalDefinition {
	target: string
}

export default {
	dispatcher: (signal: ComponentSignal, context: Context): ThunkFunc => (
		dispatch,
		getState
	) => {
		const { target, signal: signalName } = signal
		const [band, scope, type] = signalName.split("/")
		if (band !== "component" || !scope || !type || !target) return context

		const handler = getSignal(scope, type)
		const viewId = context.getViewId()
		return handler.dispatcher(signal, context)(
			(state: PlainComponentState) => {
				dispatch({
					type: "component/set",
					payload: {
						id: target,
						componentType: scope,
						view: viewId,
						state,
					},
				})
			},
			() => selectState(getState(), scope, target, viewId)
		)
	},
}
