import { Context } from "../context/context"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"

const useParams = (
	context: Context,
	namespace: string,
	name: string,
	type: string
) =>
	usePlatformFunc(() => platform.getBotParams(context, namespace, name, type))

const callGenerator = platform.callGeneratorBot

export { useParams, callGenerator }
