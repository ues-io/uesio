import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../context/context"
import { UesioThunkAPI } from "../utils"
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

export default { getMetadataList, getAvailableNamespaces }
