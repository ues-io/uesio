import { Uesio } from "./hooks"
import { Dispatcher, getPlatform } from "../store/store"
import { StoreAction } from "../store/actions/actions"
import { Context } from "../context/context"
import { BotParams, BotResponse } from "../platform/platform"

function callBot(
	context: Context,
	namespace: string,
	name: string,
	params: BotParams
): Promise<BotResponse> {
	const platform = getPlatform()
	return platform.callBot(context, namespace, name, params)
}

class BotAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>

	callBot = callBot
}

export { BotAPI, callBot }
