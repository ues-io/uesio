import RuntimeState from "../store/types/runtimestate"
import { ViewDef } from "./viewdef"
import {
	LOAD,
	LoadSignal,
	CANCEL,
	SAVE,
	SaveSignal,
} from "./viewdefbandsignals"

import yaml from "yaml"
import { getNodeAtPath } from "../yamlutils/yamlutils"
import { Platform, SaveViewRequest } from "../platform/platform"

import { batch } from "react-redux"
import { BandAction } from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { ThunkFunc, Dispatcher, DispatchReturn } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"
import {
	add as addViewDef,
	cancel as cancelViewDef,
	save as saveViewDef,
	setYaml,
} from "../bands/viewdef"
import { AnyAction } from "redux"
import { PayloadAction } from "@reduxjs/toolkit"

const VIEWDEF_BAND = "viewdef"

const YAML_OPTIONS = {
	simpleKeys: true,
	keepNodeTypes: false,
}

const getDefinitionDoc = (doc: yaml.Document.Parsed): yaml.Document => {
	const defDoc = new yaml.Document(YAML_OPTIONS)
	defDoc.contents = getNodeAtPath("definition", doc.contents)
	return defDoc
}

class ViewDefBand {
	static getSignalHandlers(): SignalsHandler {
		return {
			[SAVE]: {
				dispatcher: (
					signal: SaveSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<PayloadAction>,
						getState: () => RuntimeState,
						platform: Platform
					): DispatchReturn => {
						const saveRequest: SaveViewRequest = {}
						const state = getState().viewdef?.entities
						// Loop over view defs
						if (state) {
							for (const defKey of Object.keys(state)) {
								const defState = state[defKey]
								if (defState?.yaml === defState?.originalYaml) {
									continue
								}
								if (defState?.yaml) {
									saveRequest[
										defKey
									] = defState.yaml.toString()
								}
							}
						}
						await platform.saveViews(context, saveRequest)
						dispatch(saveViewDef())
						return context
					}
				},
			},
			[CANCEL]: {
				dispatcher: (
					signal: SaveSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<PayloadAction>
					): DispatchReturn => {
						dispatch(cancelViewDef())
						return context
					}
				},
			},
			[LOAD]: {
				dispatcher: (
					signal: LoadSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<AnyAction>,
						getState: () => RuntimeState,
						platform: Platform
					): DispatchReturn => {
						const namespace = signal.namespace
						const viewname = signal.name
						const viewid = ViewDefBand.makeId(namespace, viewname)
						const viewDef = await platform.getView(
							context,
							namespace,
							viewname
						)
						const yamlDoc = yaml.parseDocument(
							viewDef,
							YAML_OPTIONS
						)
						const defDoc = getDefinitionDoc(yamlDoc)
						const dependenciesDoc = getNodeAtPath(
							"dependencies",
							yamlDoc.contents
						)

						batch(() => {
							dispatch(
								addViewDef({
									namespace,
									name: viewname,
									dependencies: dependenciesDoc?.toJSON(),
								})
							)
							dispatch(
								setYaml({
									entity: viewid,
									path: "",
									yaml: defDoc,
								})
							)
						})
						return context
					}
				},
			},
		}
	}

	static receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc {
		const handlers = ViewDefBand.getSignalHandlers()
		const handler = handlers && handlers[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	static receiveAction(
		action: BandAction,
		state: RuntimeState
	): RuntimeState {
		return state
	}

	static getActor(state: RuntimeState, target: string): ViewDef {
		return new ViewDef(state.viewdef?.entities?.[target] || null)
	}

	static makeId(namespace: string, name: string): string {
		return `${namespace}.${name}`
	}

	static getSignalProps(/*signal: SignalDefinition*/): PropDescriptor[] {
		return []
	}
}

export { VIEWDEF_BAND, YAML_OPTIONS, ViewDefBand }
