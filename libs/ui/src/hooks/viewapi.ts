import { Dispatcher } from "../store/store"
import { Definition } from "../definition/definition"
import yaml from "yaml"

import { batch } from "react-redux"
import { Uesio } from "./hooks"
import { AnyAction } from "redux"
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
import convertToPath from "lodash.topath"
import get from "lodash.get"

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

	addDefinition(
		path: string,
		definition: Definition,
		index?: number,
		bankDrop = false
	) {
		const viewDefId = this.uesio.getViewDefId()
		if (viewDefId) {
			this.dispatcher(
				addDefinition({
					entity: viewDefId,
					path,
					definition,
					index,
					bankDrop,
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
			})
		}
	}

	moveDefinition(fromPath: string, toPath: string) {
		const viewDefId = this.uesio.getViewDefId()
		const viewDef = this.uesio.getViewDef()
		const pathArray = convertToPath(toPath)
		const index = parseInt(pathArray[pathArray.length - 2], 10)
		if (viewDefId && viewDef && viewDef.definition) {
			const fromPathArray = convertToPath(fromPath)
			fromPathArray.splice(-1)
			const def = get(viewDef.definition, fromPathArray)
			this.dispatcher(
				moveDefinition({
					entity: viewDefId,
					fromPath,
					definition: def,
					toPath,
					index,
					bankDrop: false,
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
