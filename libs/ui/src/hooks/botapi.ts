import { Context } from "../context/context"
import { BotParams, platform } from "../platform/platform"
import { getErrorString } from "../utilexports"
import usePlatformFunc from "./useplatformfunc"

const useParams = (
  context: Context,
  namespace: string,
  name: string,
  type: string,
) =>
  usePlatformFunc(
    () => platform.getBotParams(context, namespace, name, type),
    [namespace, name, type],
    !!(namespace && name && type),
  )

const useCallBot = (
  context: Context,
  namespace: string,
  name: string,
  params: BotParams = {},
  enabled = true,
) =>
  usePlatformFunc(
    () => platform.callBot(context, namespace, name, params),
    [namespace, name, JSON.stringify(params)],
    !!(namespace && name && enabled),
  )

const callGenerator = async (
  context: Context,
  namespace: string,
  name: string,
  params: BotParams,
) => {
  try {
    return await platform.callGeneratorBot(context, namespace, name, params)
  } catch (err) {
    return {
      success: false,
      error: getErrorString(err),
    }
  }
}

const callBot = async (
  context: Context,
  namespace: string,
  name: string,
  params: BotParams,
) => {
  try {
    return await platform.callBot(context, namespace, name, params)
  } catch (err) {
    return {
      success: false,
      error: getErrorString(err),
    }
  }
}
export { useParams, callGenerator, callBot, useCallBot }
