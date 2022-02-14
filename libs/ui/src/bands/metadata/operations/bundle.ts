import { createAsyncThunk } from "@reduxjs/toolkit"
import { BotResponse } from "../../../platform/platform"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"

export default createAsyncThunk<
	BotResponse,
	{
		context: Context
	},
	UesioThunkAPI
>("metadata/bundle", async ({ context }, api) => {
	return api.extra.bundle(context)
})
