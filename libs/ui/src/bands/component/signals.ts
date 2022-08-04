import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { ThunkFunc } from "../../store/store"
import { FieldValue } from "../wirerecord/types"

import { selectComponentsById } from "./selectors"
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
			const targetComponents = selectComponentsById(getState(), target)

			// When we have no matches in state, we still want the signal to fire.
			const targets = targetComponents.length
				? targetComponents
				: [{ id: target, state: {} }]

			for (const component of targets) {
				const { state } = component as any
				handler.dispatcher(
					signal,
					context,
					handler.slice && state
						? state[handler.slice]
						: component.state,
					(state: PlainComponentState | undefined) => {
						dispatch({
							type: "component/set",
							payload: {
								id: component.id,
								componentType: scope,
								view: viewId,
								state: handler.slice
									? {
											...(component.state as Record<
												string,
												any
											>),
											[handler.slice]: state,
									  }
									: state,
							},
						})
					},
					platform
				)
			}

			return context
		},
}
