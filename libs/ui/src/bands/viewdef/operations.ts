import { AnyAction, PayloadAction } from "@reduxjs/toolkit"
import { Context } from "../../context/context"
import { Platform, SaveViewRequest } from "../../platform/platform"
import { Dispatcher } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"
import { save as saveViewDef, add as addViewDef, setYaml } from "."
import yaml from "yaml"
import { batch } from "react-redux"
import { getNodeAtPath, YAML_OPTIONS } from "../../yamlutils/yamlutils"
import { Definition, DefinitionMap } from "../../definition/definition"
import get from "lodash.get"
import { useStyleProperty } from "../../styles/styles"
import { setSelectedNode } from "../builder"
import { getDefinitionKey } from "../../component/path"
import { addDefinition as addDef } from "."

const save = (context: Context) => async (
	dispatch: Dispatcher<PayloadAction>,
	getState: () => RuntimeState,
	platform: Platform
) => {
	const saveRequest: SaveViewRequest = {}
	const state = getState().viewdef?.entities
	// Loop over view defs
	if (state) {
		for (const defKey of Object.keys(state)) {
			const defState = state[defKey]
			if (defState?.yaml === defState?.originalYaml) {
				continue
			}
			if (defState?.yaml) {
				saveRequest[defKey] = defState.yaml.toString()
			}
		}
	}
	await platform.saveViews(context, saveRequest)
	dispatch(saveViewDef())
	return context
}

const load = (context: Context, namespace: string, name: string) => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState,
	platform: Platform
) => {
	const viewid = `${namespace}.${name}`
	const viewDef = await platform.getView(context, namespace, name)
	const yamlDoc = yaml.parseDocument(viewDef, YAML_OPTIONS)
	const defDoc = new yaml.Document(YAML_OPTIONS)
	defDoc.contents = getNodeAtPath("definition", yamlDoc.contents)
	const dependenciesDoc = getNodeAtPath("dependencies", yamlDoc.contents)

	batch(() => {
		dispatch(
			addViewDef({
				namespace,
				name,
				dependencies: dependenciesDoc?.toJSON(),
			})
		)
		dispatch(
			setYaml({
				entity: viewid,
				path: "",
				yaml: defDoc,
			})
		)
	})
	return context
}

const addDefinition = (
	context: Context,
	path: string,
	definition: Definition,
	index?: number
) => {
	return async (
		dispatch: Dispatcher<AnyAction>,
		getState: () => RuntimeState
	) => {
		const view = context.getView()

		if (!view) {
			return context
		}

		const viewState = view.getViewDef(getState())

		if (!viewState) {
			return context
		}

		const viewDefinition = viewState.definition
		const currentArray = get(viewDefinition, path) || []

		// A nicer way to have a default for undefined value
		const newIndex = useStyleProperty(index, currentArray.length)

		batch(() => {
			dispatch(
				addDef({
					entity: view.getViewDefId(),
					path,
					definition,
					index: newIndex,
				})
			)

			const newPath = `${path}["${newIndex}"]["${getDefinitionKey(
				definition as DefinitionMap
			)}"]`
			dispatch(setSelectedNode(newPath))
		})

		return context
	}
}

export default {
	save,
	load,
	addDefinition,
}
