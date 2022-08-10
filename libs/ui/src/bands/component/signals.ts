import produce from "immer"
import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { ThunkFunc } from "../../store/store"
import { selectState } from "./selectors"

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
			const viewId = context.getViewId()
			const target = signalTarget || handler.target || ""

			const state = selectState(getState(), scope, target, viewId)

			// If the return value of calling dispatcher is a value,
			// then just set the state to that value.
			const dispatchResult = produce(state, (draft) =>
				handler.dispatcher(draft, signal, context, platform)
			)

			dispatch({
				type: "component/set",
				payload: {
					id: target,
					componentType: scope,
					view: viewId,
					state: dispatchResult,
				},
			})

			return context
		},
}
