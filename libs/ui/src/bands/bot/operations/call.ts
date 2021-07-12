import { createAsyncThunk } from "@reduxjs/toolkit"
import { parseKey } from "../../../component/path"
import { BotParams, BotResponse } from "../../../platform/platform"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"

export default createAsyncThunk<
	BotResponse,
	{
		botname: string
		context: Context
		params: BotParams
	},
	UesioThunkAPI
>("bot/call", async ({ botname, context, params }, api) => {
	const [namespace, name] = parseKey(botname)
	const mergedParams = context.mergeMap(params)
	return await api.extra.callBot(context, namespace, name, mergedParams || {})
})
