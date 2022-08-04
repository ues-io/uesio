import { Context } from "../context/context"
import { Definition } from "./definition"
import { ThunkFunc } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { ComponentState, PlainComponentState } from "../bands/component/types"
import { Platform } from "../platform/platform"

type SignalDispatcher = (
	signal: SignalDefinition,
	context: Context
) => ThunkFunc

type ComponentSignalDispatcher = (
	signal: SignalDefinition,
	context: Context,
	state: Record<string, unknown>,
	setState: (state: PlainComponentState | undefined) => void,
	platform: Platform
) => void

// interface ComponentSignalDispatcher<T> {
// 	(
// 		signal: SignalDefinition,
// 		context: Context,
// 		state: T,
// 		setState: (state: PlainComponentState | undefined) => void,
// 		platform: Platform
// 	): void
// }

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
	slice?: string
}
// interface ComponentSignalDescriptor<T> {
// 	label?: string
// 	properties?: (signal: SignalDefinition) => PropDescriptor[]
// 	dispatcher: ComponentSignalDispatcher<T>
// 	target?: string
// 	slice?: string
// }

type SignalDefinition = {
	signal: string
	[key: string]: Definition
	onerror?: {
		continue: boolean
		notify: boolean
		signals: SignalDefinition[]
	}
}

export { SignalDefinition, SignalDescriptor, ComponentSignalDescriptor }
