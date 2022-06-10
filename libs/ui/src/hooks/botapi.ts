import { Context } from "../context/context"
import { BotParams, platform } from "../platform/platform"
import { Uesio } from "./hooks"
import usePlatformFunc from "./useplatformfunc"

class BotAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useParams(context: Context, namespace: string, name: string, type: string) {
		return usePlatformFunc(() =>
			platform.getBotParams(context, namespace, name, type)
		)
	}
	async callGenerator(
		context: Context,
		namespace: string,
		name: string,
		params: BotParams
	) {
		return platform.callGeneratorBot(context, namespace, name, params)
	}
}

export { BotAPI }
