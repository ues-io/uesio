import { context, definition } from "@uesio/ui"
import { get } from "./defapi"
import { FullPath } from "./path"

const getAvailablePanelIds = (context: context.Context) =>
  Object.keys(getAvailablePanels(context))

const getAvailablePanels = (context: context.Context) => {
  const result = get(
    context,
    new FullPath("viewdef", context.getViewDefId(), '["panels"]'),
  ) as definition.DefinitionMap
  return result
}

export { getAvailablePanelIds, getAvailablePanels }
