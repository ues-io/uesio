import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import { ActionGroup, ACTOR } from "../store/actions/actions"
import { ThunkFunc, Dispatcher, DispatchReturn } from "../store/store"
import { DefinitionMap } from "../definition/definition"
import { YamlDoc } from "../definition/definition"
import Dependencies from "../store/types/dependenciesstate"

import get from "lodash.get"
import { VIEWDEF_BAND } from "./viewdefband"
import { useStyleProperty } from "../styles/styles"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { AddDefinitionSignal, ADD_DEFINITION } from "./viewdefsignals"
import { batch } from "react-redux"
import { getDefinitionKey } from "../component/path"
import { Context } from "../context/context"
import { setSelectedNode } from "../bands/builder"
import { AnyAction } from "redux"

type PlainViewDef = {
	name: string
	namespace: string
	definition?: ViewDefinition
	yaml?: YamlDoc
	dependencies?: Dependencies
	originalYaml?: YamlDoc
}

type PlainViewDefMap = {
	[key: string]: PlainViewDef
}

type ViewDefinition = {
	components: DefinitionMap
	wires: DefinitionMap
}

class ViewDef extends Actor {
	static actionGroup: ActionGroup = {}

	static signalsHandler: SignalsHandler = {
		[ADD_DEFINITION]: {
			dispatcher: (
				signal: AddDefinitionSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<AnyAction>,
					getState: () => RuntimeState
				): DispatchReturn => {
					const { path, definition, index } = signal
					const view = context.getView()

					if (view) {
						const viewState = view.getViewDef(getState()).toState()
						const viewDefinition = viewState.definition
						const currentArray = get(viewDefinition, path) || []

						// A nicer way to have a default for undefined value
						const newIndex = useStyleProperty(
							index,
							currentArray.length
						)

						batch(() => {
							dispatch({
								type: ACTOR,
								band: VIEWDEF_BAND,
								name: ADD_DEFINITION,
								data: {
									path,
									definition,
									index: newIndex,
								},
								target: view.getViewDefId(),
							})

							const newPath = `${path}["${newIndex}"]["${getDefinitionKey(
								definition as DefinitionMap
							)}"]`
							dispatch(setSelectedNode(newPath))
						})
					}
					return context
				}
			},
		},
	}

	constructor(source: PlainViewDef | null) {
		super()
		this.valid = !!source
		this.source = source || ({} as PlainViewDef)
	}

	source: PlainViewDef
	valid: boolean

	receiveAction(action: AnyAction, state: RuntimeState): RuntimeState {
		return state
	}

	receiveSignal(signal: SignalDefinition, context: Context): ThunkFunc {
		const handler = ViewDef.signalsHandler[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	// Serializes this wire into a redux state
	toState(): PlainViewDef {
		return { ...this.source }
	}

	getId(): string {
		return `${this.source.namespace}.${this.source.name}`
	}

	getName(): string {
		return this.source.name
	}

	getNamespace(): string {
		return this.source.namespace
	}

	getDefinition(): ViewDefinition | undefined {
		return this.source.definition
	}

	getDependencies(): Dependencies | undefined {
		return this.source.dependencies
	}
}

export { ViewDef, PlainViewDef, PlainViewDefMap }
