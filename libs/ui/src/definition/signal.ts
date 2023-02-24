import { Context, ContextOptions } from "../context/context"
import { Definition } from "./definition"
import { PlainComponentState } from "../bands/component/types"
import { Draft } from "@reduxjs/toolkit"
import { Platform } from "../platform/platform"

type SignalDispatcher = (
	signal: SignalDefinition,
	context: Context
) => Promise<Context> | Context

type ComponentSignalDispatcher<T> = (
	state: Draft<T>,
	signal: SignalDefinition,
	context: Context,
	platform: Platform,
	id: string
) => void

type SignalDescriptor = {
	dispatcher: SignalDispatcher
}

type ComponentSignalDescriptor<T = PlainComponentState> = {
	dispatcher: ComponentSignalDispatcher<T>
	target?: string
}

type SignalDefinition = {
	signal: string
	[key: string]: Definition
	"uesio.context"?: ContextOptions
	stepId?: string
	onerror?: {
		continue: boolean
		notify: boolean
		signals: SignalDefinition[]
	}
}

export { SignalDefinition, SignalDescriptor, ComponentSignalDescriptor }
