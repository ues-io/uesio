import { Dispatcher } from "../store/store"
import { Definition } from "../definition/definition"
import yaml from "yaml"

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
import {
	useViewConfigValue,
	useViewDefinition,
	useViewYAML,
} from "../bands/viewdef/selectors"

const VIEW_BAND = "view"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useConfigValue(key: string): string {
		const viewDefId = this.uesio.getViewDefId()
		return viewDefId ? useViewConfigValue(viewDefId, key) : ""
	}

	useDefinition(path?: string) {
		const viewDefId = this.uesio.getViewDefId()
		return viewDefId ? useViewDefinition(viewDefId, path) : undefined
	}

	useYAML() {
		const viewDefId = this.uesio.getViewDefId()
		return viewDefId ? useViewYAML(viewDefId) : undefined
	}

	setDefinition(path: string, definition: Definition) {
		const viewDefId = this.uesio.getViewDefId()
		if (viewDefId) {
			this.dispatcher(
				setDefinition({
					entity: viewDefId,
					path,
					definition,
				})
			)
		}
	}

	addDefinition(path: string, definition: Definition, index?: number) {
		const viewDefId = this.uesio.getViewDefId()
		if (viewDefId) {
			this.dispatcher(
				addDefinition({
					entity: viewDefId,
					path,
					definition,
					index,
				})
			)
		}
	}

	addDefinitionPair(path: string, definition: Definition, key: string) {
		const viewDefId = this.uesio.getViewDefId()
		if (viewDefId) {
			this.dispatcher(
				addDefinitionPair({
					entity: viewDefId,
					path,
					definition,
					key,
				})
			)
		}
	}

	changeDefinitionKey(path: string, key: string) {
		const viewDefId = this.uesio.getViewDefId()
		if (viewDefId) {
			this.dispatcher(
				changeDefinitionKey({
					entity: viewDefId,
					path,
					key,
				})
			)
		}
	}

	removeDefinition(path?: string) {
		const viewDefId = this.uesio.getViewDefId()
		const usePath = path || this.uesio.getPath()
		if (viewDefId) {
			batch(() => {
				this.dispatcher(
					removeDefinition({
						entity: viewDefId,
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
		const viewDefId = this.uesio.getViewDefId()
		if (viewDefId) {
			this.dispatcher(
				moveDefinition({
					entity: viewDefId,
					fromPath,
					toPath,
				})
			)
		}
	}

	setYaml(path: string, yamlDoc: yaml.Document) {
		const viewDefId = this.uesio.getViewDefId()
		if (viewDefId) {
			this.dispatcher(
				setYaml({
					entity: viewDefId,
					path,
					yaml: yamlDoc,
				})
			)
		}
	}
}

export { ViewAPI, VIEW_BAND }
