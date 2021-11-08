import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../context/context"
import { SaveResponseBatch } from "../../load/saveresponse"
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
	Context,
	UesioThunkAPI
>(
	"builder/getAvailableNamespaces",
	async (context, api) => api.extra.getAvailableNamespaces(context),
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
			if (defState?.yaml === defState?.originalYaml) {
				continue
			}
			if (defState?.yaml) {
				changes[defKey] = {
					"studio.definition": defState.yaml.toString(),
					"uesio.id": `${workspace.app}_${workspace.name}_${defState.name}`,
				}
			}
		}
	}
	return api.extra.saveData(new Context(), {
		wires: [
			{
				wire: "saveview",
				collection: "studio.views",
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
