import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../context/context"
import { UesioThunkAPI } from "../utils"

const fetchTheme = createAsyncThunk<
	string,
	{
		namespace: string
		name: string
		context: Context
	},
	UesioThunkAPI
>("theme/fetch", ({ namespace, name, context }, api) =>
	api.extra.getTheme(context, namespace, name)
)

export default {
	fetchTheme,
}
