import { Context } from "../context/context"
import { Definition } from "./definition"
import { ThunkFunc } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { PlainComponentState } from "../bands/component/types"
import { Platform } from "../platform/platform"

type SignalDispatcher = (
	signal: SignalDefinition,
	context: Context
) => ThunkFunc
interface ComponentSignalDispatcher<T> {
	(arg: {
		signal: SignalDefinition
		context: Context
		state: T
		setState: (state: PlainComponentState | undefined) => void
		platform: Platform
	}): void
}

type SignalDescriptor = {
	label: string
	properties: (signal: SignalDefinition) => PropDescriptor[]
	dispatcher: SignalDispatcher
}
interface ComponentSignalDescriptor<T = PlainComponentState> {
	label?: string
	properties?: (signal: SignalDefinition) => PropDescriptor[]
	dispatcher: ComponentSignalDispatcher<T>
	target?: string
	slice?: string
}

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
