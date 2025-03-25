import { hash } from "@twind/core"
import { Context } from "../../context/context"

const makeViewId = (
  context: Context,
  viewdef: string,
  componentId?: string,
  path?: string,
) => {
  const mergedComponentId = componentId && context.mergeString(componentId)
  return `${viewdef}(${mergedComponentId || (path && hash(path)) || "$root"})`
}
export { makeViewId }
