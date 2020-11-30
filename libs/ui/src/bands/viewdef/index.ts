import {
	createEntityAdapter,
	createSlice,
	PayloadAction,
} from "@reduxjs/toolkit"
import setWith from "lodash.setwith"
import toPath from "lodash.topath"
import { YamlDoc } from "../../definition/definition"
import { PlainViewDef } from "../../viewdef/viewdef"
import { YAML_OPTIONS } from "../../viewdef/viewdefband"
import yaml from "yaml"
import { setNodeAtPath } from "../../yamlutils/yamlutils"

type YamlUpdatePayload = {
	viewDef: string
	path: string
	yaml: YamlDoc
}

const updateYaml = (payload: YamlUpdatePayload, state: PlainViewDef) => {
	const yamlDoc = payload.yaml
	const path = payload.path
	const pathArray = toPath(path)
	const definition = yamlDoc.toJSON()

	// Set the definition JS Object from the yaml
	setWith(state, ["definition"].concat(pathArray), definition)

	if (!state.originalYaml) {
		state.originalYaml = yamlDoc
	}

	if (!state.yaml) {
		state.yaml = yamlDoc
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
}

const viewdefAdapter = createEntityAdapter<PlainViewDef>({
	selectId: (viewdef) => `${viewdef.namespace}.${viewdef.name}`,
})

const viewDefSlice = createSlice({
	name: "viewdef",
	initialState: viewdefAdapter.getInitialState(),
	reducers: {
		add: viewdefAdapter.upsertOne,
		setYaml: (state, { payload }: PayloadAction<YamlUpdatePayload>) => {
			const viewdefs = state.entities
			const defState = viewdefs[payload.viewDef]
			if (!defState) {
				return
			}
			updateYaml(payload, defState)
		},
		cancel: (state) => {
			const viewdefs = state.entities
			for (const defKey of Object.keys(viewdefs)) {
				const defState = viewdefs[defKey]
				if (!defState) {
					continue
				}
				if (defState.yaml === defState.originalYaml) {
					continue
				}
				const original = defState.originalYaml
				delete defState.yaml
				delete defState.originalYaml
				if (original) {
					updateYaml(
						{
							viewDef: defKey,
							path: "",
							yaml: original,
						},
						defState
					)
				}
			}
		},
		save: (state) => {
			const viewdefs = state.entities
			for (const defKey of Object.keys(viewdefs)) {
				const defState = viewdefs[defKey]
				if (!defState) {
					continue
				}
				if (defState.yaml === defState.originalYaml) {
					continue
				}
				const yamlDoc = defState.yaml
				delete defState.originalYaml
				delete defState.yaml
				if (yamlDoc) {
					updateYaml(
						{
							viewDef: defKey,
							path: "",
							yaml: yamlDoc,
						},
						defState
					)
				}
			}
		},
	},
})

export const { add, cancel, save, setYaml } = viewDefSlice.actions
export default viewDefSlice.reducer
