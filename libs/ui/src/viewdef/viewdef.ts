import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import { ActionGroup, ACTOR } from "../store/actions/actions"
import { ThunkFunc, Dispatcher, DispatchReturn } from "../store/store"
import {
	DefinitionMap,
	Definition,
	DefinitionList,
} from "../definition/definition"
import { YamlDoc } from "../definition/definition"
import Dependencies from "../store/types/dependenciesstate"
import yaml from "yaml"
import {
	setNodeAtPath,
	removeNodeAtPath,
	addNodeAtPath,
	getNodeAtPath,
	addNodePairAtPath,
	getPathFromPathArray,
} from "../yamlutils/yamlutils"

import toPath from "lodash.topath"
import clone from "lodash.clone"
import setWith from "lodash.setwith"
import get from "lodash.get"
import {
	SET_DEPENDENCIES,
	SetDependenciesAction,
	SET_YAML,
	SetYamlAction,
	RemoveDefinitionAction,
	REMOVE_DEFINITION,
	SET_DEFINITION,
	SetDefinitionAction,
	MOVE_DEFINITION,
	MoveDefinitionAction,
	AddDefinitionAction,
	ADD_DEFINITION,
	ADD_DEFINITION_PAIR,
	AddDefinitionPairAction,
	CHANGE_DEFINITION_KEY,
	ChangeDefinitionKeyAction,
	ViewDefAction,
} from "./viewdefactions"
import { YAML_OPTIONS, VIEWDEF_BAND } from "./viewdefband"
import { Collection } from "yaml/types"
import { deleteProperty } from "../util/util"
import { useStyleProperty } from "../styles/styles"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { AddDefinitionSignal } from "./viewdefsignals"
import { batch } from "react-redux"
import { getParentPath, getDefinitionKey } from "../component/path"
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

function move(
	fromList: DefinitionList,
	toList: DefinitionList,
	fromIndex: number,
	toIndex: number
): void {
	const [removed] = fromList.splice(fromIndex, 1)
	toList.splice(toIndex, 0, removed)
}

// This custom customizer will clone if a value exists,
// but return empty object if it doesn't
const cloneWithDefault = (value: unknown): unknown => clone(value) || {}

class ViewDef extends Actor {
	static actionGroup: ActionGroup = {
		[SET_DEPENDENCIES]: (
			action: SetDependenciesAction,
			state: PlainViewDef
		): PlainViewDef => {
			return Object.assign({}, state, {
				dependencies: action.data.dependencies,
			})
		},
		[SET_YAML]: (
			action: SetYamlAction,
			state: PlainViewDef
		): PlainViewDef => {
			const yamlDoc = action.data.yaml
			const path = action.data.path
			const pathArray = toPath(path)
			const definition = yamlDoc.toJSON()

			// Set the definition JS Object from the yaml
			setWith(
				state,
				["definition"].concat(pathArray),
				definition,
				cloneWithDefault
			)

			if (!state.originalYaml) {
				Object.assign(state, {
					originalYaml: yamlDoc,
				})
			}

			if (!state.yaml) {
				Object.assign(state, {
					yaml: yamlDoc,
				})
			} else {
				if (state.yaml === state.originalYaml) {
					state.originalYaml = yaml.parseDocument(
						state.originalYaml.toString(),
						YAML_OPTIONS
					)
				}

				// We actually don't want components using useYaml to rerender
				setNodeAtPath(path, state.yaml.contents, yamlDoc.contents)
			}
			return state
		},
		[REMOVE_DEFINITION]: (
			action: RemoveDefinitionAction,
			state: PlainViewDef
		): PlainViewDef => {
			const path = action.data.path
			const pathArray = toPath(path)
			if (pathArray[0] === "components") {
				pathArray.pop() // Remove the component name
			}
			const index = pathArray.pop() // Get the index
			const parent = get(state.definition, pathArray)
			if (index) {
				const newParent = Array.isArray(parent)
					? parent.filter(
							(item: Definition, itemIndex: number) =>
								parseInt(index, 10) !== itemIndex
					  )
					: deleteProperty(parent, index)
				if (state.definition) {
					setWith(
						state,
						["definition"].concat(pathArray),
						newParent,
						cloneWithDefault
					)
				}
				if (state.yaml) {
					// create a new document so components using useYaml will rerender
					state.yaml = yaml.parseDocument(
						state.yaml.toString(),
						YAML_OPTIONS
					)
					removeNodeAtPath(
						pathArray.concat([index]),
						state.yaml.contents
					)
				}
			}
			return state
		},
		[SET_DEFINITION]: (
			action: SetDefinitionAction,
			state: PlainViewDef
		): PlainViewDef => {
			const path = action.data.path
			const pathArray = toPath(path)
			const definition = action.data.definition

			// Set the definition JS Object
			setWith(
				state,
				["definition"].concat(pathArray),
				definition,
				cloneWithDefault
			)

			if (state.yaml) {
				// create a new document so components using useYaml will rerender
				state.yaml = yaml.parseDocument(
					state.yaml.toString(),
					YAML_OPTIONS
				)
				const newNode = definition ? yaml.createNode(definition) : null
				setNodeAtPath(path, state.yaml.contents, newNode)
			}

			return state
		},
		[MOVE_DEFINITION]: (
			action: MoveDefinitionAction,
			state: PlainViewDef
		): PlainViewDef => {
			const fromPath = action.data.fromPath
			const destPath = action.data.toPath
			// Traverse paths simultaneously until paths diverge.
			const fromPathArr = toPath(fromPath)
			const toPathArr = toPath(destPath)
			const fromIndex = fromPathArr.pop()
			const toIndex = toPathArr.pop()

			if (fromIndex && toIndex) {
				const fromParent = get(state.definition, fromPathArr)
				const toParent = get(state.definition, toPathArr)

				move(
					fromParent,
					toParent,
					parseInt(fromIndex, 10),
					parseInt(toIndex, 10)
				)

				const destParentPath = getParentPath(destPath)
				const fromParentPath = getParentPath(fromPath)

				// Now set both parents so they can trigger redux
				// Set the definition JS Object
				if (
					!fromParentPath.startsWith(destParentPath) ||
					toParent === fromParent
				) {
					setWith(
						state,
						["definition"].concat(fromPathArr),
						fromParent,
						cloneWithDefault
					)
				}
				if (toParent !== fromParent) {
					if (!destParentPath.startsWith(fromParentPath)) {
						setWith(
							state,
							["definition"].concat(toPathArr),
							toParent,
							cloneWithDefault
						)
					}
				}

				if (state.yaml) {
					// create a new document so components using useYaml will rerender
					state.yaml = yaml.parseDocument(
						state.yaml.toString(),
						YAML_OPTIONS
					)
					const fromYamlParent = getNodeAtPath(
						fromPathArr,
						state.yaml.contents
					)
					const toYamlParent = getNodeAtPath(
						toPathArr,
						state.yaml.contents
					)

					const item = getNodeAtPath(
						[fromIndex],
						fromYamlParent
					) as yaml.AST.BlockMap
					removeNodeAtPath([fromIndex], fromYamlParent)
					// This is kind of a hack. But the yaml library doesn't have an
					// "add at index" method.
					;(toYamlParent as Collection).items.splice(
						parseInt(toIndex, 10),
						0,
						item
					)
				}
			}
			return state
		},
		[ADD_DEFINITION]: (
			action: AddDefinitionAction,
			state: PlainViewDef
		): PlainViewDef => {
			const path = action.data.path
			const pathArray = toPath(path)
			const definition = action.data.definition
			const currentArray = get(state.definition, path) || []
			const newIndex = action.data.index || 0
			currentArray.splice(newIndex, 0, definition)
			setWith(
				state,
				["definition"].concat(pathArray),
				currentArray,
				cloneWithDefault
			)

			if (state.yaml && definition) {
				// create a new document so components using useYaml will rerender
				state.yaml = yaml.parseDocument(
					state.yaml.toString(),
					YAML_OPTIONS
				)
				const newNode = yaml.createNode(definition, true)
				if (newNode) {
					addNodeAtPath(path, state.yaml.contents, newNode, newIndex)
				}
			}

			return state
		},
		[ADD_DEFINITION_PAIR]: (
			action: AddDefinitionPairAction,
			state: PlainViewDef
		): PlainViewDef => {
			const path = action.data.path
			const pathArray = toPath(path)
			const definition = action.data.definition
			const key = action.data.key

			setWith(
				state,
				["definition"].concat(pathArray).concat(key),
				definition,
				cloneWithDefault
			)

			if (state.yaml) {
				// create a new document so components using useYaml will rerender
				state.yaml = yaml.parseDocument(
					state.yaml.toString(),
					YAML_OPTIONS
				)
				const newNode = yaml.createNode(definition, true)
				addNodePairAtPath(path, state.yaml.contents, newNode, key)
			}

			return state
		},
		[CHANGE_DEFINITION_KEY]: (
			action: ChangeDefinitionKeyAction,
			state: PlainViewDef,
			allState: RuntimeState
		): PlainViewDef => {
			const path = action.data.path
			const pathArray = toPath(path)
			const oldKey = pathArray.pop()
			const newKey = action.data.key

			if (oldKey) {
				const parent = get(state.definition, pathArray)
				const newParent: DefinitionMap = Object.keys(parent).reduce(
					(acc, key) => ({
						...acc,
						...(key === oldKey
							? { [newKey]: parent[oldKey] }
							: { [key]: parent[key] }),
					}),
					{}
				)

				setWith(
					state,
					["definition"].concat(pathArray),
					newParent,
					cloneWithDefault
				)
				if (state.yaml) {
					// create a new document so components using useYaml will rerender
					state.yaml = yaml.parseDocument(
						state.yaml.toString(),
						YAML_OPTIONS
					)
					const parent = getNodeAtPath(
						pathArray,
						state.yaml.contents
					) as Collection
					const keyNode = parent?.items.find((item) => {
						return item.key.value === oldKey
					})

					keyNode.key.value = newKey
				}
			}

			if (allState.builder) {
				allState.builder.selectedNode = getPathFromPathArray(
					pathArray.concat(newKey)
				)
			}

			return state
		},
	}

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

	receiveAction(action: ViewDefAction, state: RuntimeState): RuntimeState {
		const actionHandler = ViewDef.actionGroup[action.name]
		const target = this.getId()
		if (actionHandler) {
			return Actor.assignState("viewdef", state, {
				[target]: actionHandler(action, state.viewdef?.[target], state),
			})
		}
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
