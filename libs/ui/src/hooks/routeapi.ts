import { getRoute } from "../bands/route/selectors"
import { Context } from "../context/context"
import { MetadataKey } from "../metadata/types"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"

const useParams = (context: Context, routeKey: MetadataKey) =>
  usePlatformFunc(() => platform.getRouteParams(context, routeKey))

export { getRoute, useParams }
