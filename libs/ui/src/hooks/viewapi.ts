import { Dispatcher } from "../store/store"
import { Definition, DefinitionMap } from "../definition/definition"
import yaml from "yaml"
import merge from "lodash.merge"
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
	useComponentVariant,
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
	useDefinitionLocal(path?: string) {
		const viewDefId = this.uesio.getViewDefId()
		if (!viewDefId) return
		return viewDefId ? useViewDefinition(viewDefId, path) : undefined
	}
	useDefinition(path?: string) {
		const def = this.useDefinitionLocal(path)
		const viewDefId = this.uesio.getViewDefId()
		if (!viewDefId) return def
		const componentType = this.uesio.getComponentType()
		if (!componentType || !def) {
			return def
		}

		const variantName = (def as DefinitionMap)["uesio.variant"] as string
		if (!variantName) {
			return def
		}

		const variant = useComponentVariant(
			viewDefId,
			componentType + "." + variantName
		)
		if (!variant) return def
		const variantCopy = JSON.parse(JSON.stringify(variant.definition))
		return merge(variantCopy, def)
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
			this.dispatcher(
				removeDefinition({
					entity: viewDefId,
					path: usePath,
				})
			)
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
