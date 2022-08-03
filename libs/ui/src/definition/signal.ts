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

type ComponentSignalDispatcher = (
	signal: SignalDefinition,
	context: Context,
	getters: {
		single: () => PlainComponentState
		all: () => PlainComponentState[]
	},
	setState: (state: PlainComponentState | undefined) => void,
	platform: Platform
) => void

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
