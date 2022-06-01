import { createAsyncThunk } from "@reduxjs/toolkit"
import { parseKey } from "../../component/path"
import { Context } from "../../context/context"

import { ThunkFunc } from "../../store/store"
import { ID_FIELD } from "../collection/types"
import { UesioThunkAPI } from "../utils"
import { PlainWireRecord } from "../wirerecord/types"
import { getMetadataListKey } from "./selectors"
import { MetadataListStore, MetadataType } from "./types"
import { save as saveBuilder } from "."

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

const save =
	(context: Context): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const changes: Record<string, PlainWireRecord> = {}
		const state = getState().viewdef?.entities
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

				const [, name] = parseKey(defState.key)

				if (defState?.content) {
					changes[defKey] = {
						"uesio/studio.definition": defState.content,
						[ID_FIELD]: `${workspace.app}_${workspace.name}_${name}`,
					}
				}
			}
		}

		await platform.saveData(new Context(), {
			wires: [
				{
					wire: "saveview",
					collection: "uesio/studio.view",
					changes,
					deletes: {},
				},
			],
		})

		dispatch(saveBuilder())

		return context
	}

export default {
	getMetadataList,
	getAvailableNamespaces,
	save,
}
