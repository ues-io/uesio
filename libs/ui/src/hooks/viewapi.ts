import {
	Dispatcher,
	useView,
	DispatchReturn,
	useViewDefinition,
	useViewConfigValue,
	useViewYAML,
	useViewDependencies,
} from "../store/store"
import { ACTOR, BAND } from "../store/actions/actions"
import {
	SET_DEFINITION,
	SET_YAML,
	ADD_DEFINITION,
	REMOVE_DEFINITION,
	MOVE_DEFINITION,
	ADD_DEFINITION_PAIR,
	CHANGE_DEFINITION_KEY,
	RemoveDefinitionAction,
	ChangeDefinitionKeyAction,
	AddDefinitionPairAction,
	SetYamlAction,
	MoveDefinitionAction,
	SetDefinitionAction,
	ViewDefAction,
} from "../viewdef/viewdefactions"
import { Definition } from "../definition/definition"
import yaml from "yaml"

import { SignalAPI } from "./signalapi"
import { View, ViewParams } from "../view/view"
import { SET_SELECTED_NODE } from "../builder/builderbandactions"
import { batch } from "react-redux"
import { LOAD } from "../view/viewbandsignals"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
import toPath from "lodash.topath"
import { BUILDER_BAND } from "../builder/builderband"
import Dependencies from "../store/types/dependenciesstate"
import { trimPathToComponent } from "../component/path"

import { SetSelectedNodeAction } from "../builder/builderbandactions"

const VIEW_BAND = "view"
const VIEWDEF_BAND = "viewdef"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<ViewDefAction | SetSelectedNodeAction>

	// Wraps our store's useView result (POJO) in a nice View class
	// with convenience methods to make the api easier to consume for end users.
	useView(namespace: string, name: string, path: string): View {
		const plainView = useView(namespace, name, path)
		return new View(plainView)
	}

	useConfigValue(key: string): string {
		const view = this.uesio.getView()
		if (view) {
			return useViewConfigValue(view, key)
		}
		return ""
	}

	useDefinition(path?: string, view?: View): Definition {
		const useView = view || this.uesio.getView()
		if (useView) {
			return useViewDefinition(useView, path)
		}
		return undefined
	}

	useDependencies(view?: View): Dependencies | undefined {
		const useView = view || this.uesio.getView()
		if (useView) {
			return useViewDependencies(useView)
		}
		return undefined
	}

	useYAML(): yaml.Document | undefined {
		const view = this.uesio.getView()
		if (view) {
			return useViewYAML(view)
		}
		return undefined
	}

	setDefinition(path: string, definition: Definition): void {
		const view = this.uesio.getView()
		if (view) {
			const action: SetDefinitionAction = {
				type: ACTOR,
				band: VIEWDEF_BAND,
				name: SET_DEFINITION,
				data: {
					path,
					definition,
				},
				target: view.getViewDefId(),
			}
			this.dispatcher(action)
		}
	}

	addDefinition(
		path: string,
		definition: Definition,
		index?: number
	): DispatchReturn {
		const view = this.uesio.getView()
		return this.uesio.signal.run(
			{
				band: VIEWDEF_BAND,
				signal: ADD_DEFINITION,
				target: view?.getViewDefId(),
				path,
				definition,
				index,
			},
			new Context([
				{
					view,
				},
			])
		)
	}

	addDefinitionPair(path: string, definition: Definition, key: string): void {
		const view = this.uesio.getView()
		if (view) {
			const action: AddDefinitionPairAction = {
				type: ACTOR,
				band: VIEWDEF_BAND,
				name: ADD_DEFINITION_PAIR,
				data: {
					path,
					definition,
					key,
				},
				target: view.getViewDefId(),
			}
			this.dispatcher(action)
		}
	}

	changeDefinitionKey(path: string, key: string): void {
		const view = this.uesio.getView()
		if (view) {
			const action: ChangeDefinitionKeyAction = {
				type: ACTOR,
				band: VIEWDEF_BAND,
				name: CHANGE_DEFINITION_KEY,
				data: {
					path,
					key,
				},
				target: view.getViewDefId(),
			}
			this.dispatcher(action)
		}
	}

	removeDefinition(path?: string): void {
		const view = this.uesio.getView()
		const usePath = path || this.uesio.getPath()
		if (view) {
			batch(() => {
				const removeDefAction: RemoveDefinitionAction = {
					type: ACTOR,
					band: VIEWDEF_BAND,
					name: REMOVE_DEFINITION,
					data: {
						path: usePath,
					},
					target: view.getViewDefId(),
				}
				this.dispatcher(removeDefAction)
				// When a definition is removed, select its parent
				const pathArray = toPath(usePath)
				pathArray.pop()
				const newPath = trimPathToComponent(pathArray)
				const setSelectedNodeAction: SetSelectedNodeAction = {
					type: BAND,
					band: BUILDER_BAND,
					name: SET_SELECTED_NODE,
					data: {
						path: newPath,
					},
				}

				this.dispatcher(setSelectedNodeAction)
			})
		}
	}

	moveDefinition(fromPath: string, toPath: string): void {
		const view = this.uesio.getView()
		if (view) {
			const action: MoveDefinitionAction = {
				type: ACTOR,
				band: VIEWDEF_BAND,
				name: MOVE_DEFINITION,
				data: {
					fromPath,
					toPath,
				},
				target: view.getViewDefId(),
			}
			this.dispatcher(action)
		}
	}

	setYaml(path: string, yamlDoc: yaml.Document): void {
		const view = this.uesio.getView()
		if (view) {
			const action: SetYamlAction = {
				type: ACTOR,
				band: VIEWDEF_BAND,
				name: SET_YAML,
				data: {
					path,
					yaml: yamlDoc,
				},
				target: view.getViewDefId(),
			}
			this.dispatcher(action)
		}
	}

	loadView(
		namespace: string,
		name: string,
		path: string,
		params: ViewParams | undefined,
		context: Context
	): DispatchReturn {
		return this.uesio.signal.run(
			{
				band: VIEW_BAND,
				signal: LOAD,
				namespace,
				name,
				path,
				params,
			},
			context
		)
	}
}

export { ViewAPI }
