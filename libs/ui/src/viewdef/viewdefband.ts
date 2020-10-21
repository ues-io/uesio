import RuntimeState from "../store/types/runtimestate"
import { ViewDef, PlainViewDefMap } from "./viewdef"
import { SET_YAML, SET_DEPENDENCIES } from "./viewdefactions"
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
import {
	BandAction,
	ActionGroup,
	ACTOR,
	StoreAction,
	BAND,
} from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { ThunkFunc, Dispatcher, DispatchReturn } from "../store/store"
import {
	ADD_VIEWDEF,
	AddViewDefAction,
	CancelViewDefAction,
	SaveViewDefAction,
} from "./viewdefbandactions"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"

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
	static actionGroup: ActionGroup = {
		[ADD_VIEWDEF]: (
			action: AddViewDefAction,
			state: PlainViewDefMap
		): PlainViewDefMap => {
			const namespace = action.data.namespace
			const name = action.data.name
			const viewDefId = ViewDefBand.makeId(
				action.data.namespace,
				action.data.name
			)

			return {
				...state,
				[viewDefId]: {
					...state[viewDefId],
					name,
					namespace,
				},
			}
		},
		[CANCEL]: (
			action: CancelViewDefAction,
			state: PlainViewDefMap,
			allState: RuntimeState
		): PlainViewDefMap => {
			// Loop over view defs
			for (const defKey of Object.keys(state)) {
				const viewDef = ViewDefBand.getActor(allState, defKey)

				if (viewDef.valid) {
					const defState = state[defKey]
					if (defState.yaml === defState.originalYaml) {
						continue
					}
					const original = defState.originalYaml
					delete defState.yaml
					delete defState.originalYaml
					if (original) {
						viewDef.receiveAction(
							{
								type: ACTOR,
								name: SET_YAML,
								target: defKey,
								band: VIEWDEF_BAND,
								data: {
									path: "",
									yaml: original,
								},
							},
							allState
						)
					}
				}
			}
			return { ...state }
		},
		[SAVE]: (
			action: SaveViewDefAction,
			state: PlainViewDefMap,
			allState: RuntimeState
		): PlainViewDefMap => {
			// Loop over view defs
			for (const defKey of Object.keys(state)) {
				const viewDef = ViewDefBand.getActor(allState, defKey)

				if (viewDef.valid) {
					const defState = state[defKey]
					if (defState.yaml === defState.originalYaml) {
						continue
					}
					const yamlDoc = defState.yaml
					delete defState.originalYaml
					delete defState.yaml
					if (yamlDoc) {
						viewDef.receiveAction(
							{
								type: ACTOR,
								name: SET_YAML,
								target: defKey,
								band: VIEWDEF_BAND,
								data: {
									path: "",
									yaml: yamlDoc,
								},
							},
							allState
						)
					}
				}
			}
			return { ...state }
		},
	}

	static getSignalHandlers(): SignalsHandler {
		return {
			[SAVE]: {
				dispatcher: (
					signal: SaveSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<StoreAction>,
						getState: () => RuntimeState,
						platform: Platform
					): DispatchReturn => {
						const saveRequest: SaveViewRequest = {}
						const state = getState().viewdef
						// Loop over view defs
						if (state) {
							for (const defKey of Object.keys(state)) {
								const defState = state[defKey]
								if (defState.yaml === defState.originalYaml) {
									continue
								}
								if (defState.yaml) {
									saveRequest[
										defKey
									] = defState.yaml.toString()
								}
							}
						}
						await platform.saveViews(context, saveRequest)
						dispatch({
							type: BAND,
							band: VIEWDEF_BAND,
							name: SAVE,
						})
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
						dispatch: Dispatcher<StoreAction>
					): DispatchReturn => {
						dispatch({
							type: BAND,
							band: VIEWDEF_BAND,
							name: CANCEL,
						})
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
						dispatch: Dispatcher<StoreAction>,
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
							dispatch({
								type: BAND,
								band: VIEWDEF_BAND,
								name: ADD_VIEWDEF,
								data: {
									namespace,
									name: viewname,
								},
							})
							if (dependenciesDoc) {
								const dependencies = dependenciesDoc.toJSON()
								dispatch({
									type: ACTOR,
									band: VIEWDEF_BAND,
									name: SET_DEPENDENCIES,
									target: viewid,
									data: {
										dependencies,
									},
								})
							}
							dispatch({
								type: ACTOR,
								band: VIEWDEF_BAND,
								name: SET_YAML,
								target: viewid,
								data: {
									path: "",
									yaml: defDoc,
								},
							})
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
		const handler = this.actionGroup[action.name]

		if (handler) {
			return Object.assign({}, state, {
				viewdef: handler(action, state.viewdef, state),
			})
		}
		return state
	}

	static getActor(state: RuntimeState, target: string): ViewDef {
		return new ViewDef(state.viewdef?.[target] || null)
	}

	static makeId(namespace: string, name: string): string {
		return `${namespace}.${name}`
	}

	static getSignalProps(/*signal: SignalDefinition*/): PropDescriptor[] {
		return []
	}
}

export { VIEWDEF_BAND, YAML_OPTIONS, ViewDefBand }
