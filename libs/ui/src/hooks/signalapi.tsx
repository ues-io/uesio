import { SignalDefinition } from "../definition/signal"
import { Uesio, useHotKeyCallback } from "./hooks"
import { Context } from "../context/context"
import componentSignal from "../bands/component/signals"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { registry, run, runMany } from "../signals/signals"
import { addBlankSelectOption } from "../collectionexports"

class SignalAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	// Returns a handler function for running a list of signals
	getHandler = (
		signals: SignalDefinition[] | undefined,
		context: Context = this.uesio.getContext()
	) => {
		if (!signals) return undefined
		return async () => this.runMany(signals, context)
	}

	useRegisterHotKey = (
		keycode: string | undefined,
		signals: SignalDefinition[] | undefined
	) =>
		useHotKeyCallback(keycode, (event) => {
			event.preventDefault()
			this.getHandler(signals)?.()
		})

	runMany = async (signals: SignalDefinition[], context: Context) =>
		runMany(signals, context)

	run = (signal: SignalDefinition, context: Context) => run(signal, context)

	getProperties = (signal: SignalDefinition) => {
		const descriptor = registry[signal?.signal] || componentSignal
		return [
			...defaultSignalProps(),
			...(descriptor.properties ? descriptor.properties(signal) : []),
		]
	}
}

function defaultSignalProps(): PropDescriptor[] {
	const signalIds = Object.keys(registry)
	return [
		{
			name: "signal",
			label: "Signal",
			type: "SELECT",
			options: addBlankSelectOption(
				signalIds.map((signal) => ({
					value: signal,
					label: registry[signal].label || signal,
				}))
			),
		},
	]
}
export { SignalAPI }
