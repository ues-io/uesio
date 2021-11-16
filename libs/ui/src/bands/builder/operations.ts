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
	const viewChanges: Record<string, PlainWireRecord> = {}
	const viewDefState = api.getState().viewdef?.entities
	const workspace = context.getWorkspace()

	if (!workspace) throw new Error("No Workspace in context")

	// Loop over view defs
	if (viewDefState) {
		for (const defKey of Object.keys(viewDefState)) {
			const defState = viewDefState[defKey]
			if (defState?.yaml === defState?.originalYaml) {
				continue
			}
			if (defState?.yaml) {
				viewChanges[defKey] = {
					"studio.definition": defState.yaml.toString(),
					"uesio.id": `${workspace.app}_${workspace.name}_${defState.name}`,
				}
			}
		}
	}

	const componentVariantState = api.getState().componentvariant?.entities
	const componentVariantChanges: Record<string, PlainWireRecord> = {}
	// Loop over componentvariants
	if (componentVariantState) {
		for (const defKey of Object.keys(componentVariantState)) {
			const defState = componentVariantState[defKey]
			if (defState?.yaml === defState?.originalYaml) {
				continue
			}
			if (defState?.yaml) {
				componentVariantChanges[defKey] = {
					"studio.definition": defState.yaml.toString(),
					"uesio.id": defKey, //`${workspace.app}_${workspace.name}_${defState.name}`,
				}
			}
		}
	}

	return api.extra.saveData(new Context(), {
		wires: [
			{
				wire: "saveview",
				collection: "studio.views",
				changes: viewChanges,
				deletes: {},
			},
			{
				wire: "savecomponentvariant",
				collection: "studio.componentvariants",
				changes: componentVariantChanges,
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
