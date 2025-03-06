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
    // TODO: This approach is less than ideal due to fixed delimiter pattern, for example
    // a url that contains {sometokenname} which is actually part of the url and not intended
    // to be replaced with a token. To solve for, would need to account for some way to escape
    // the sequence of characters.  This is an unlikely scenario but this approach may need
    // to be revisited to more accurately identify tokens.
    path = path.replace(new RegExp(`{${key}}`, "g"), tokens[key])
  }
  return path
}

const getRouteAssignmentUrl = (
  context: Context,
  collection: string,
  viewtype?: string,
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
