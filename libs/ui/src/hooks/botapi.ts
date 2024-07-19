import { Context } from "../context/context"
import { BotParams, platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"

const useParams = (
	context: Context,
	namespace: string,
	name: string,
	type: string
) =>
	usePlatformFunc(
		() => platform.getBotParams(context, namespace, name, type),
		[namespace, name, type],
		!!(namespace && name && type)
	)

const useCallBot = (
	context: Context,
	namespace: string,
	name: string,
	params: BotParams = {},
	enabled = true
) =>
	usePlatformFunc(
		() => platform.callBot(context, namespace, name, params),
		[namespace, name, JSON.stringify(params)],
		!!(namespace && name && enabled)
	)

const callGenerator = platform.callGeneratorBot

export { useParams, callGenerator, useCallBot }
