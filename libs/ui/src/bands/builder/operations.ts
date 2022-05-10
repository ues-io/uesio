import { createAsyncThunk } from "@reduxjs/toolkit"
import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { SaveResponseBatch } from "../../load/saveresponse"
import { getNodeAtPath, newDoc, parse } from "../../yamlutils/yamlutils"
import { ID_FIELD } from "../collection/types"
import { UesioThunkAPI } from "../utils"
import { PlainWireRecord } from "../wirerecord/types"
import { getMetadataListKey } from "./selectors"
import { MetadataListStore, MetadataType } from "./types"

const getMetadataList = createAsyncThunk<
	MetadataListStore,
	{
		context: Context
		metadataType: MetadataType
		namespace: string
		grouping?: string
	},
	UesioThunkAPI
>(
	"builder/getMetadataList",
	async ({ context, metadataType, namespace, grouping }, api) =>
		api.extra.getMetadataList(context, metadataType, namespace, grouping),
	{
		condition: ({ metadataType, namespace, grouping }, { getState }) => {
			const { builder } = getState()
			const key = getMetadataListKey(metadataType, namespace, grouping)
			const status = builder.metadata?.[key]?.status
			return status !== "FULFILLED" && status !== "PENDING"
		},
	}
)

const getAvailableNamespaces = createAsyncThunk<
	MetadataListStore,
	{
		context: Context
		metadataType?: MetadataType
	},
	UesioThunkAPI
>(
	"builder/getAvailableNamespaces",
	async ({ context, metadataType }, api) =>
		api.extra.getAvailableNamespaces(context, metadataType),
	{
		condition: (context, { getState }) => {
			const { builder } = getState()
			const status = builder.namespaces?.status
			return status !== "FULFILLED" && status !== "PENDING"
		},
	}
)

const save = createAsyncThunk<
	SaveResponseBatch,
	{
		context: Context
	},
	UesioThunkAPI
>("builder/save", async ({ context }, api) => {
	const changes: Record<string, PlainWireRecord> = {}
	const state = api.getState().viewdef?.entities
	const workspace = context.getWorkspace()

	if (!workspace) throw new Error("No Workspace in context")

	// Loop over view defs
	if (state) {
		for (const defKey of Object.keys(state)) {
			const defState = state[defKey]
			if (!defState) continue
			if (defState.content === defState.original) {
				continue
			}

			const yamlDoc = parse(defState.content || "")
			const depsNode = getNodeAtPath("definition", yamlDoc.contents)

			const defDoc = newDoc()
			defDoc.contents = depsNode
			const defYaml = defDoc.toString() || ""

			const [, name] = parseKey(defState.key)

			if (defState?.content) {
				changes[defKey] = {
					"uesio/studio.definition": defYaml,
					[ID_FIELD]: `${workspace.app}_${workspace.name}_${name}`,
				}
			}
		}
	}

	return api.extra.saveData(new Context(), {
		wires: [
			{
				wire: "saveview",
				collection: "uesio/studio.view",
				changes,
				deletes: {},
			},
		],
	})
})

export default {
	getMetadataList,
	getAvailableNamespaces,
	save,
}
