import { SignalDefinition } from "../definition/signal"
import { Uesio, useHotKeyCallback } from "./hooks"
import { Context } from "../context/context"
import { registry, run, runMany } from "../signals/signals"

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

	getSignalsByBand = (band: string) =>
		Object.fromEntries(
			Object.entries(registry).filter(([key]) =>
				key.startsWith(band.toLowerCase())
			)
		)

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

	getSignalDescriptor = (signal: string) => registry[signal]
}
export { SignalAPI }
