import { createAsyncThunk } from "@reduxjs/toolkit"
import { parseKey } from "../../../component/path"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"

export default createAsyncThunk<
	string,
	{
		context: Context
	},
	UesioThunkAPI
>("componentvariant/load", async ({ context }, api) => {
	const viewDefId = context.getViewDefId() //TO-DO
	if (!viewDefId) throw new Error("No View Definition in Context")
	const [namespace, name] = parseKey(viewDefId)
	return api.extra.getView(context, namespace, name)
})
