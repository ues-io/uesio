import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"

export default createAsyncThunk<
	string,
	{
		context: Context
		namespace: string
		name: string
	},
	UesioThunkAPI
>("viewdef/load", async ({ context, namespace, name }, api) =>
	api.extra.getView(context, namespace, name)
)
