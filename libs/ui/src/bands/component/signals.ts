import { getSignal } from "../../component/registry"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { ThunkFunc } from "../../store/store"
import { selectComponentsByTarget } from "./selectors"
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
			const view = context.getViewId()
			const target = signalTarget || handler.target || ""
			const targetComponents = selectComponentsByTarget(
				getState(),
				target
			)

			// When we have no matches in state, we still want the signal to fire.
			const targets = targetComponents.length
				? targetComponents
				: [{ id: target, state: {} }]

			for (const component of targets) {
				handler.dispatcher({
					signal,
					context,
					state: component.state,
					setState: (state: PlainComponentState | undefined) => {
						dispatch({
							type: "component/set",
							payload: {
								id: component.id,
								componentType: scope,
								view,
								state,
							},
						})
					},
					platform,
				})
			}

			return context
		},
}
