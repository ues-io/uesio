import {
	Dispatcher,
	useView,
	useViewDefinition,
	useViewConfigValue,
	useViewYAML,
	useViewDependencies,
} from "../store/store"
import { Definition } from "../definition/definition"
import yaml from "yaml"

import { View } from "../view/view"
import { batch } from "react-redux"
import { Uesio } from "./hooks"
import toPath from "lodash.topath"
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
	addDefinition,
} from "../bands/viewdef"

const VIEW_BAND = "view"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	// Wraps our store's useView result (POJO) in a nice View class
	// with convenience methods to make the api easier to consume for end users.
	useView(namespace: string, name: string, path: string) {
		const plainView = useView(namespace, name, path)
		return new View(plainView)
	}

	useConfigValue(key: string): string {
		const view = this.uesio.getView()
		return view ? useViewConfigValue(view, key) : ""
	}

	useDefinition(path?: string, view?: View) {
		const useView = view || this.uesio.getView()
		return useView ? useViewDefinition(useView, path) : undefined
	}

	useDependencies(view?: View) {
		const useView = view || this.uesio.getView()
		return useView ? useViewDependencies(useView) : undefined
	}

	useYAML() {
		const view = this.uesio.getView()
		return view ? useViewYAML(view) : undefined
	}

	setDefinition(path: string, definition: Definition) {
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

	addDefinition(path: string, definition: Definition, index?: number) {
		const view = this.uesio.getView()
		if (view) {
			this.dispatcher(
				addDefinition({
					entity: view.getViewDefId(),
					path,
					definition,
					index,
				})
			)
		}
	}

	addDefinitionPair(path: string, definition: Definition, key: string) {
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

	changeDefinitionKey(path: string, key: string) {
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

	removeDefinition(path?: string) {
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

	moveDefinition(fromPath: string, toPath: string) {
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

	setYaml(path: string, yamlDoc: yaml.Document) {
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
}

export { ViewAPI, VIEW_BAND }
