import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { ThunkFunc } from "../../store/store"
import { selectState } from "./selectors"
import { PlainComponentState } from "./types"

interface ComponentSignal extends SignalDefinition {
	target?: string
}

export default {
	dispatcher: (signal: ComponentSignal, context: Context): ThunkFunc => (
		dispatch,
		getState,
		platform
	) => {
		const { target: signalTarget, signal: signalName } = signal
		const [band, scope, type] = signalName.split("/")
		if (band !== "component" || !scope || !type) return context

		const handler = getSignal(scope, type)
		const viewId = context.getViewId()
		const target = signalTarget || handler.target || ""

		handler.dispatcher(
			signal,
			context,
			() => selectState(getState(), scope, target, viewId),
			(state: PlainComponentState | undefined) => {
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
			platform
		)

		return context
	},
}
