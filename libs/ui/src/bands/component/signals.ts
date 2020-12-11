import { AnyAction } from "redux"
import { parseKey } from "../../component/path"
import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { Dispatcher } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"
import { selectState } from "./selectors"
import { PlainComponentState } from "./types"

interface ComponentSignal extends SignalDefinition {
	target: string
}

export default {
	dispatcher: (signal: ComponentSignal, context: Context) => async (
		dispatch: Dispatcher<AnyAction>,
		getState: () => RuntimeState
	) => {
		const { target, signal: signalName } = signal
		const [band, scope, type] = signalName.split("/")
		if (band !== "component" || !scope || !type || !target) return context

		const [namespace, name] = parseKey(scope)
		const handler = getSignal(namespace, name, type)
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
