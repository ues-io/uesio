import { Dispatcher } from "../store/store"
import { Definition } from "../definition/definition"
import yaml from "yaml"
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
} from "../bands/viewdef/selectors"
import { mergeInVariants } from "../component/component"
import { useView } from "../bands/view/selectors"
import { useEffect } from "react"
import { ViewParams } from "../bands/view/types"
import { Context } from "../context/context"
import loadViewOp from "../bands/view/operations/load"
import { useComponentVariant } from "../bands/componentvariant/selectors"

const VIEW_BAND = "view"

class ViewAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useView(viewId?: string, params?: ViewParams, context?: Context) {
		const view = useView(viewId || "")
		useEffect(() => {
			const newParams = params ? JSON.stringify(params) : ""
			const oldParams =
				view && view.params ? JSON.stringify(view.params) : ""
			if (!view || (view && oldParams !== newParams)) {
				this.dispatcher(
					loadViewOp({
						context: context || this.uesio.getContext(),
						path: this.uesio.getPath() || "",
						params,
					})
				)
			}
		})
		return view
	}
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

		if (typeof def !== "object" || Array.isArray(def)) return def

		const variantName = def["uesio.variant"] as string
		if (!variantName) {
			return def
		}

		const variant = useComponentVariant(componentType, variantName)

		if (!variant) return def
		return mergeInVariants(def, variant, this.uesio.getContext())
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
		const usePath = path || this.uesio.getPath() || ""
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
