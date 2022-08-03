import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { ThunkFunc } from "../../store/store"
import { PlainWireRecord } from "../wirerecord/types"
import { selectComponent, selectComponentsById } from "./selectors"
import { PlainComponentState } from "./types"

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

			const getters = {
				all: () => selectComponentsById(getState(), target),
				single: () => {
					const fullState = selectComponent(
						getState(),
						scope,
						target,
						viewId
					)
					return handler.slice
						? (fullState as PlainWireRecord)?.[handler.slice]
						: fullState
				},
			}

			handler.dispatcher(
				signal,
				context,
				getters,
				// Setstate
				(state: PlainComponentState | undefined) => {
					console.log({ set: target })
					dispatch({
						type: "component/set",
						payload: {
							id: target,
							componentType: scope,
							view: viewId,
							state: handler.slice
								? {
										...(selectComponent(
											getState(),
											scope,
											target,
											viewId
										) as PlainWireRecord),
										[handler.slice]: state,
								  }
								: state,
						},
					})
				},
				platform
			)

			return context
		},
}
