import RuntimeState from "../store/types/runtimestate"
import { ComponentActor } from "./componentactor"
import { BandAction, StoreAction } from "../store/actions/actions"
import { Dispatcher } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { SignalDefinition } from "../definition/signal"

const COMPONENT_BAND = "component"

class ComponentBand {
	static receiveSignal(): Dispatcher<StoreAction> {
		return (): null => null
	}

	static receiveAction(
		action: BandAction,
		state: RuntimeState
	): RuntimeState {
		return state
	}

	static getActor(
		state: RuntimeState,
		target: string,
		view: string
	): ComponentActor {
		return new ComponentActor(
			state.view?.[view]?.components[target] || null
		)
	}

	static getSignalProps(signal: SignalDefinition): PropDescriptor[] {
		const handlers = ComponentActor.signalHandlers
		const scopeOptions = Object.keys(handlers).map((scopeKey) => {
			return {
				value: scopeKey,
				label: scopeKey,
			}
		})

		const props: PropDescriptor[] = [
			{
				name: "scope",
				type: "SELECT",
				label: "Scope",
				options: scopeOptions,
			},
		]
		const currentScope = signal.scope && handlers[signal.scope]
		if (currentScope) {
			const signalOptions = Object.keys(currentScope).flatMap(
				(key: string) => {
					const handler = currentScope[key]
					if (!handler?.public) return []
					return [
						{
							value: key,
							label: handler.label || key,
						},
					]
				}
			)
			props.push({
				name: "signal",
				type: "SELECT",
				label: "Signal",
				options: signalOptions,
			})

			const handler = currentScope[signal.signal]

			if (handler && handler.public && handler.properties) {
				return props.concat(handler.properties(signal))
			}
		}
		return props
	}
}

export { ComponentBand, COMPONENT_BAND }
