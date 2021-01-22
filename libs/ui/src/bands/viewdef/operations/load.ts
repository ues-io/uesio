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
>("viewdef/load", async ({ context }, api) => {
	const viewDefId = context.getViewDefId()
	if (!viewDefId) throw new Error("No View Definition in Context")
	const [namespace, name] = parseKey(viewDefId)
	return await api.extra.getView(context, namespace, name)
})
