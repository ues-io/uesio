import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { wire } from "@uesio/ui"

const collectionMetadata = createAsyncThunk<
	wire.LoadResponseBatch,
	{
		collectionName: string
		context: Context
	},
	UesioThunkAPI
>(
	"collection/getCollectionMetadata",
	async ({ collectionName, context }, api) =>
		api.extra.getCollectionMetadata(context, collectionName),
	{
		// condition: (context, { getState }) => {
		// 	const { collection } = getState()
		// 	const status = collection[context.collectionName]?.status
		// 	return status !== "FULFILLED" && status !== "PENDING"
		// },
	}
)

export default { collectionMetadata }
