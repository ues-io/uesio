import { Context } from "../context/context"

import { MetadataType } from "../metadata/types"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"
import { dispatchRouteDeps } from "../bands/route/utils"
import { loadScripts } from "./usescripts"

const useMetadataList = (
  context: Context,
  metadataType: MetadataType,
  namespace: string,
  grouping?: string,
) =>
  usePlatformFunc(
    () => platform.getMetadataList(context, metadataType, namespace, grouping),
    [metadataType, namespace, grouping],
  )

const useAvailableNamespaces = (
  context: Context,
  metadataType?: MetadataType,
) =>
  usePlatformFunc(
    () => platform.getAvailableNamespaces(context, metadataType),
    [metadataType],
  )

const getBuilderDeps = async (context: Context) => {
  const response = await platform.getBuilderDeps(context)

  await loadScripts(response.componentpack, context)

  dispatchRouteDeps(response)
}

const loadBuilderDeps = async (context: Context) => {
  const response = await platform.getViewDeps(context)

  await loadScripts(response.componentpack, context)

  dispatchRouteDeps(response)
}

export {
  useMetadataList,
  useAvailableNamespaces,
  getBuilderDeps,
  loadBuilderDeps,
}
