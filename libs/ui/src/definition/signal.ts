import type { Context, ContextOptions } from "../context/context"
import type { Definition } from "./definition"
import type { PlainComponentState } from "../bands/component/types"
import type { Draft } from "@reduxjs/toolkit"
import type { Platform } from "../platform/platform"

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

export type { SignalDefinition, SignalDescriptor, ComponentSignalDescriptor }
