import { context, wire } from "@uesio/ui"
import {
  PropertyTypeHandler,
  getBaseWireFieldDef,
  getClosestWireInContext,
  getPropPathFromName,
  getPropertyId,
} from "../handlerutils"
import { getAvailableWireIds } from "../../api/wireapi"
import { getSelectListMetadataFromOptions } from "./select"
import {
  ComponentProperty,
  WireProperty,
} from "../../properties/componentproperty"
import { getDefAtPath, set as setDef } from "../../api/defapi"
import { FullPath } from "../../api/path"

const getWireSelectListMetadata = (
  context: context.Context,
  def: ComponentProperty,
  addBlankOption?: boolean,
) =>
  getSelectListMetadataFromOptions(
    def.name,
    getAvailableWireIds(context).map(
      (wireId) =>
        ({
          value: wireId,
          label: wireId,
        }) as wire.SelectOption,
    ),
    addBlankOption ? "No wire selected" : undefined,
  )

const wireHandler: PropertyTypeHandler = {
  getField: (property, context) =>
    getBaseWireFieldDef(property, "SELECT", {
      selectlist: getWireSelectListMetadata(context, property, true),
    }),
  getValue: (def, property: WireProperty, context, initialValue, path) => {
    const [propPath] = getPropPathFromName(property.name, path)
    let value = getDefAtPath(def, propPath) as string
    // Special behavior --- if the wire property is set to default to context,
    // and there is no value, then fetch the value from context
    if (!value && property.defaultToContext) {
      value = getClosestWireInContext(def, path) as string
    }
    return value
  },
}

const stringListValueGetter: PropertyTypeHandler["getValue"] = (
  def,
  property,
  context,
  initialValue,
  path,
) => {
  const [propPath] = getPropPathFromName(property.name, path)
  let value = getDefAtPath(def, propPath) as string[]
  if (value !== undefined) {
    value = ((value || []) as string[]).reduce(
      (acc, curr) => ({
        ...acc,
        [curr]: true,
      }),
      {},
    ) as string[]
  }
  return value
}

// Values are stored as a list in the YAML,
// but we are rendering these using the Multiselect control,
// which works with a Record<string, boolean> where the keys are values which
// should be present in the YAML list
const getStringListSetter =
  (propPath: FullPath, context: context.Context) =>
  (value: Record<string, boolean>) => {
    setDef(
      context,
      propPath,
      // If we get a null value, swap it to undefined,
      // which will result in the property being removed from the YAML
      value === null ? undefined : Object.keys(value),
    )
  }

const wiresHandler: PropertyTypeHandler = {
  getField: (property, context) =>
    getBaseWireFieldDef(property, "MULTISELECT", {
      selectlist: getWireSelectListMetadata(context, property),
    }),
  getValue: stringListValueGetter,
  getSetters: (def, property, context, currentValue, path) => {
    if (property.viewOnly) return []
    const name = getPropertyId(property)
    const [propPath] = getPropPathFromName(name, path)
    return [getStringListSetter(propPath, context)]
  },
}

export { wireHandler, wiresHandler, stringListValueGetter, getStringListSetter }
