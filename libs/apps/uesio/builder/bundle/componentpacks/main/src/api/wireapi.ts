import { context, wire } from "@uesio/ui"
import { get } from "./defapi"
import { FullPath } from "./path"

const getAvailableWireIds = (context: context.Context) =>
  Object.keys(getAvailableWires(context))

const getAvailableWires = (context: context.Context) => {
  const result = get(
    context,
    new FullPath("viewdef", context.getViewDefId(), '["wires"]'),
  ) as wire.WireDefinitionMap
  return result || {}
}

const getWireDefinition = (context: context.Context, wireId: string) =>
  getAvailableWires(context)?.[wireId]

const getFieldMetadata = (
  context: context.Context,
  wireId: string,
  fieldId: string,
) => {
  const lwire = context.getWire(wireId)
  if (!lwire) return
  return lwire.getCollection().getField(fieldId)
}

// getWirePath returns a FullPath corresponding to a View Wire,
// which can be used to get/set properties on that Wire.
const getWirePath = (context: context.Context, wireName: string): FullPath =>
  new FullPath("viewdef", context.getViewDefId(), `["wires"]["${wireName}"]`)

// getWireProperty returns the value of a property on one of the view's wires,
// e.g. "collection", "batchsize", "fields", "conditions"
const getWireProperty = (
  context: context.Context,
  wireName: string,
  wireProperty: string,
) =>
  get(context, getWirePath(context, wireName).addLocal(wireProperty)) as string

export {
  getAvailableWireIds,
  getAvailableWires,
  getWirePath,
  getWireProperty,
  getFieldMetadata,
  getWireDefinition,
}
