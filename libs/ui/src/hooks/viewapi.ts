import {
	Dispatcher,
	useView,
	DispatchReturn,
	useViewDefinition,
	useViewConfigValue,
	useViewYAML,
	useViewDependencies,
} from "../store/store"
import { Definition } from "../definition/definition"
import yaml from "yaml"

import { View, ViewParams } from "../view/view"
import { batch } from "react-redux"
import { LOAD } from "../view/viewbandsignals"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
import toPath from "lodash.topath"
import Dependencies from "../store/types/dependenciesstate"
import { trimPathToComponent } from "../component/path"
import { AnyAction } from "redux"
import { setSelectedNode } from "../bands/builder"
import {
	setYaml,
	removeDefinition,
	setDefinition,
	moveDefinition,
	addDefinitionPair,
	changeDefinitionKey,
} from "../bands/viewdef"
import { ADD_DEFINITION } from "../viewdef/viewdefsignals"

const VIEW_BAND = "view"
const VIEWDEF_BAND = "viewdef"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	// Wraps our store's useView result (POJO) in a nice View class
	// with convenience methods to make the api easier to consume for end users.
	useView(namespace: string, name: string, path: string): View {
		const plainView = useView(namespace, name, path)
		return new View(plainView)
	}

	useConfigValue(key: string): string {
		const view = this.uesio.getView()
		return view ? useViewConfigValue(view, key) : ""
	}

	useDefinition(path?: string, view?: View): Definition {
		const useView = view || this.uesio.getView()
		return useView ? useViewDefinition(useView, path) : undefined
	}

	useDependencies(view?: View): Dependencies | undefined {
		const useView = view || this.uesio.getView()
		return useView ? useViewDependencies(useView) : undefined
	}

	useYAML(): yaml.Document | undefined {
		const view = this.uesio.getView()
		return view ? useViewYAML(view) : undefined
	}

	setDefinition(path: string, definition: Definition): void {
		const view = this.uesio.getView()
		if (view) {
			this.dispatcher(
				setDefinition({
					entity: view.getViewDefId(),
					path,
					definition,
				})
			)
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
					view: view?.getId(),
				},
			])
		)
	}

	addDefinitionPair(path: string, definition: Definition, key: string): void {
		const view = this.uesio.getView()
		if (view) {
			this.dispatcher(
				addDefinitionPair({
					entity: view.getViewDefId(),
					path,
					definition,
					key,
				})
			)
		}
	}

	changeDefinitionKey(path: string, key: string): void {
		const view = this.uesio.getView()
		if (view) {
			this.dispatcher(
				changeDefinitionKey({
					entity: view.getViewDefId(),
					path,
					key,
				})
			)
		}
	}

	removeDefinition(path?: string): void {
		const view = this.uesio.getView()
		const usePath = path || this.uesio.getPath()
		if (view) {
			batch(() => {
				this.dispatcher(
					removeDefinition({
						entity: view.getViewDefId(),
						path: usePath,
					})
				)
				// When a definition is removed, select its parent
				const pathArray = toPath(usePath)
				pathArray.pop()
				const newPath = trimPathToComponent(pathArray)
				this.dispatcher(setSelectedNode(newPath))
			})
		}
	}

	moveDefinition(fromPath: string, toPath: string): void {
		const view = this.uesio.getView()
		if (view) {
			this.dispatcher(
				moveDefinition({
					entity: view.getViewDefId(),
					fromPath,
					toPath,
				})
			)
		}
	}

	setYaml(path: string, yamlDoc: yaml.Document): void {
		const view = this.uesio.getView()
		if (view) {
			this.dispatcher(
				setYaml({
					entity: view.getViewDefId(),
					path,
					yaml: yamlDoc,
				})
			)
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
