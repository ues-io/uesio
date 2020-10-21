import { Context } from "../context/context"
import { Definition } from "./definition"
import { ThunkFunc } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"

type SignalDispatcher = (
	signal: SignalDefinition,
	context: Context
) => ThunkFunc

type SignalDescriptor = {
	label?: string
	public?: boolean
	properties?: (signal: SignalDefinition) => PropDescriptor[]
	dispatcher: SignalDispatcher
}

type SignalsHandler = {
	[key: string]: SignalDescriptor
}
type SignalHandlerStore = {
	[key: string]: SignalsHandler
}
type SignalBase = {
	signal: string
	band: string
	target?: string
	scope?: string
	[key: string]: Definition
}

interface ActorSignal extends SignalBase {
	target: string
}

interface BandSignal extends SignalBase {
	targets?: string[]
}

type SignalDefinition = BandSignal | ActorSignal

export {
	SignalDefinition,
	ActorSignal,
	BandSignal,
	SignalHandlerStore,
	SignalsHandler,
}
