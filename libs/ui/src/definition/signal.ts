import { Context } from "../context/context"
import { Definition } from "./definition"
import { ThunkFunc } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { PlainComponentState } from "../bands/component/types"

type SignalDispatcher = (
	signal: SignalDefinition,
	context: Context
) => ThunkFunc

type ComponentSignalDispatcher = (
	signal: SignalDefinition,
	context: Context
) => (state: PlainComponentState | undefined) => PlainComponentState | undefined

type SignalDescriptor = {
	label: string
	properties: (signal: SignalDefinition) => PropDescriptor[]
	dispatcher: SignalDispatcher
}

type ComponentSignalDescriptor = {
	label?: string
	properties?: (signal: SignalDefinition) => PropDescriptor[]
	dispatcher: ComponentSignalDispatcher
	target?: string
}

type SignalDefinition = {
	signal: string
	[key: string]: Definition
}

export { SignalDefinition, SignalDescriptor, ComponentSignalDescriptor }
