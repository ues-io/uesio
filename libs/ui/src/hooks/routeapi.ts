import { getRoute } from "../bands/route/selectors"
import { Context } from "../context/context"
import { MetadataKey } from "../metadata/types"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"
import { getRouteUrl } from "../bands/route/operations"
import { ID_FIELD } from "../collectionexports"
import { RouteTokens } from "../definition/routeassignment"

const mergePath = (
  path: string,
  tokens: RouteTokens = { recordid: `\${${ID_FIELD}}` },
) => {
  for (const key in tokens) {
    // TODO: This approach is less than ideal due to fixed deiimiter
    path = path.replace(new RegExp(`{${key}}`, "g"), tokens[key])
  }
  return path
}

const getRouteAssignmentUrl = (
  context: Context,
  viewtype = "list",
  collection = "",
  tokens?: RouteTokens,
) => {
  const assignment = context.getRouteAssignment(viewtype, collection)
  if (!assignment) return undefined

  return getRouteUrl(
    context,
    assignment.namespace,
    mergePath(
      assignment.path,
      assignment.tokens || tokens
        ? {
            ...assignment.tokens,
            ...tokens,
          }
        : undefined,
    ),
  )
}

const useParams = (context: Context, routeKey: MetadataKey) =>
  usePlatformFunc(() => platform.getRouteParams(context, routeKey))

export { getRoute, useParams, getRouteAssignmentUrl }
