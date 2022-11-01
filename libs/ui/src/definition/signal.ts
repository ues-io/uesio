import { Context } from "../context/context"
import { Definition } from "./definition"
import { ThunkFunc } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { PlainComponentState } from "../bands/component/types"
import { Draft } from "@reduxjs/toolkit"
import { Platform } from "../platform/platform"

type SignalDispatcher = (
	signal: SignalDefinition,
	context: Context
) => ThunkFunc

type ComponentSignalDispatcher<T> = (
	state: Draft<T>,
	signal: SignalDefinition,
	context: Context,
	platform: Platform
) => void

type SignalDescriptor = {
	label: string
	description: string
	properties: PropDescriptor[]
	dispatcher: SignalDispatcher
}

type ComponentSignalDescriptor<T = PlainComponentState> = {
	label?: string
	properties?: PropDescriptor[]
	dispatcher: ComponentSignalDispatcher<T>
	target?: string
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
