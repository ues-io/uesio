import { Dispatcher } from "../store/store"
import { SignalDefinition, SignalDescriptor } from "../definition/signal"
import { Uesio } from "./hooks"
import { Context } from "../context/context"

import botSignals from "../bands/bot/signals"
import routeSignals from "../bands/route/signals"
import userSignals from "../bands/user/signals"
import wireSignals from "../bands/wire/signals"
import panelSignals from "../bands/panel/signals"
import componentSignal from "../bands/component/signals"
import { AnyAction } from "@reduxjs/toolkit"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { usePanel } from "../bands/panel/selectors"
import { panelRegistry } from "../components/panel"
import { createPortal } from "react-dom"
import { ReactElement, ReactPortal } from "react"
import Slot from "../components/slot"

const registry: Record<string, SignalDescriptor> = {
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
	...panelSignals,
}

const isPanelSignal = (signal: SignalDefinition) =>
	signal.signal.startsWith("panel/")

const getPanelKey = (path: string, context: Context) =>
	`${path}:${context.getRecordId()}`

class SignalAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useHandler = (
		signals: SignalDefinition[] | undefined
	): [() => Promise<Context>, ReactElement] => {
		if (!signals) {
			return [async () => this.uesio.getContext(), <></>]
		}
		const portals: ReactPortal[] = []
		// Handle signals here
		signals.forEach((signal) => {
			// If this signal is a panel signal and we're controlling it from this
			// path, then send the context from this path into a portal
			if (isPanelSignal(signal)) {
				const panelId = signal.panel as string
				const panel = usePanel(panelId)
				const context = this.uesio.getContext()
				const path = this.uesio.getPath()
				if (
					panel &&
					panel.open &&
					panel.contextPath === getPanelKey(path, context)
				) {
					const panelInfo = panelRegistry[panelId]
					if (panelInfo && panelInfo.domNode) {
						portals.push(
							createPortal(
								<Slot
									definition={panelInfo.definition}
									listName="components"
									path={path}
									accepts={["uesio.standalone"]}
									context={context}
								/>,
								panelInfo.domNode
							)
						)
					}
				}
			}
		})

		return [this.getHandler(signals), <>{portals}</>]
	}

	// Returns a handler function for running a list of signals
	getHandler = (signals: SignalDefinition[]) => async () => {
		/*
			// More confusing alternative using reduce
			return signals.reduce<Promise<Context>>(
				async (context, signal) => this.run(signal, await context),
				Promise.resolve(this.uesio.getContext())
			)
			*/

		let context = this.uesio.getContext()
		for (const signal of signals) {
			// Special handling for panel signals
			let useSignal = signal
			if (isPanelSignal(signal)) {
				useSignal = {
					...signal,
					path: getPanelKey(this.uesio.getPath(), context),
				}
			}
			// Keep adding to context as each signal is run
			context = await this.run(useSignal, context)
		}
		return context
	}

	run = (signal: SignalDefinition, context: Context) => {
		const descriptor = registry[signal.signal] || componentSignal
		return this.dispatcher(descriptor.dispatcher(signal, context))
	}

	getProperties = (signal: SignalDefinition) => {
		const descriptor = registry[signal.signal] || componentSignal
		let props = defaultSignalProps()
		if (descriptor.properties) {
			props = props.concat(descriptor.properties(signal))
		}
		return props
	}
}

function defaultSignalProps(): PropDescriptor[] {
	const signalIds = Object.keys(registry)
	return [
		{
			name: "signal",
			label: "Signal",
			type: "SELECT",
			options: signalIds.map((signal) => ({
				value: signal,
				label: registry[signal].label || signal,
			})),
		},
	]
}
export { SignalAPI }
