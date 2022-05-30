import { Dispatcher } from "../store/store"
import { SignalDefinition } from "../definition/signal"
import { Uesio } from "./hooks"
import { Context } from "../context/context"

import { PanelDefinitionMap } from "../definition/panel"

import componentSignal from "../bands/component/signals"
import { AnyAction } from "@reduxjs/toolkit"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { usePanel } from "../bands/panel/selectors"
import { ReactNode } from "react"
import { ComponentInternal } from "../component/component"
import Panel from "../components/panel"
import { registry, run, runMany } from "../signals/signals"

const isPanelSignal = (signal: SignalDefinition) =>
	signal.signal.startsWith("panel/")

const getPanelKey = (path: string, context: Context) => {
	const recordContext = context.getRecordId()
	return recordContext ? `${path}:${recordContext}` : path
}

class SignalAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useHandler = (
		signals: SignalDefinition[] | undefined,
		context: Context = this.uesio.getContext()
	): [(() => Promise<Context>) | undefined, ReactNode] => [
		this.getHandler(signals, context),
		signals?.flatMap((signal) => {
			// If this signal is a panel signal and we're controlling it from this
			// path, then send the context from this path into a portal
			if (isPanelSignal(signal)) {
				const panelId = signal.panel as string

				const panel = usePanel(panelId)
				const path = this.uesio.getPath()
				if (panel && panel.contextPath === getPanelKey(path, context)) {
					const viewDef = context.getViewDef()
					const panels: PanelDefinitionMap | undefined =
						viewDef?.panels
					if (!panels || !panelId) return null

					const panelDef = panels[panelId]
					if (!panelDef) return null
					const componentType = panelDef["uesio.type"]

					if (componentType) {
						return [
							<Panel key={panelId} context={context}>
								<ComponentInternal
									definition={{ ...panelDef, id: panelId }}
									path={path}
									context={context}
									componentType={componentType}
								/>
							</Panel>,
						]
					}
				}
			}
			return []
		}),
	]

	// Returns a handler function for running a list of signals
	getHandler = (
		signals: SignalDefinition[] | undefined,
		context: Context = this.uesio.getContext()
	) => {
		if (!signals) return undefined
		return async () => this.runMany(signals, context)
	}

	runMany = async (signals: SignalDefinition[], context: Context) =>
		runMany(this.dispatcher, this.uesio.getPath(), signals, context)

	run = (signal: SignalDefinition, context: Context) =>
		run(this.dispatcher, this.uesio.getPath(), signal, context)

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
export { SignalAPI, getPanelKey }
