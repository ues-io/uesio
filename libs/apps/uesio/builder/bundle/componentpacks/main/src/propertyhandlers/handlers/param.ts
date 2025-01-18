import { context, wire } from "@uesio/ui"
import { ComponentProperty } from "../../properties/componentproperty"
import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"
import { getSelectListMetadataFromOptions } from "./select"

const getParamsSelectListMetadata = (
  context: context.Context,
  def: ComponentProperty,
): wire.SelectListMetadata =>
  getSelectListMetadataFromOptions(
    def.name,
    Object.keys(context.getViewDef()?.params || {}).map((option) => ({
      value: option,
      label: option,
    })),
    "(Select a parameter)",
  )

const paramHandler: PropertyTypeHandler = {
  getField: (property, context) =>
    getBaseWireFieldDef(property, "SELECT", {
      selectlist: getParamsSelectListMetadata(context, property),
    }),
}

export { paramHandler }
