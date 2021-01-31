import { createAsyncThunk } from "@reduxjs/toolkit"
import { ThemeState } from "./types"
import { Context } from "../../context/context"
import { UesioThunkAPI } from "../utils"

const fetchTheme = createAsyncThunk<
	ThemeState,
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
