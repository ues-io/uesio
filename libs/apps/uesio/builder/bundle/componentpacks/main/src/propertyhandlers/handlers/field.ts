import { context, wire } from "@uesio/ui"
import { getWireDefinition } from "../../api/wireapi"
import {
  FieldProperty,
  FieldsProperty,
} from "../../properties/componentproperty"
import {
  PATH_ARROW,
  PropertyTypeHandler,
  getBaseWireFieldDef,
  getObjectProperty,
  getPropPathFromName,
  getPropertyId,
} from "../handlerutils"
import { getSelectListMetadataFromOptions } from "./select"
import { getGrouping } from "../../components/property/property"
import { FullPath } from "../../api/path"
import { getStringListSetter, stringListValueGetter } from "./wire"

const getWireFieldSelectOptions = (wireDef?: wire.WireDefinition) => {
  if (!wireDef || !wireDef.fields) return [] as wire.SelectOption[]
  const { fields, viewOnly } = wireDef
  const getFields = (
    key: string,
    value: wire.ViewOnlyField | wire.WireFieldDefinition,
  ): string | string[] => {
    // Sometimes value (the field definition) will be undefined,
    // sometimes it will be an empty object, sometimes it will contain other subfields.
    // If it's either an empty object or undefined, just return the key.
    if (
      !value ||
      (typeof value === "object" && Object.keys(value).length === 0) ||
      typeof value === "string"
    ) {
      return key
    }
    if (viewOnly) {
      const viewOnlyField = value as wire.ViewOnlyField
      if (
        viewOnlyField?.type !== "MAP" &&
        viewOnlyField?.type !== "LIST" &&
        viewOnlyField?.type !== "STRUCT"
      ) {
        return key
      }
    }

    // Recursively find all nested fields, which will be within "fields" property,
    // in addition to any other top level fields on the object
    if (typeof value?.fields === "object") {
      return [key].concat(recursivelyGetFields(key, value.fields))
    }
    return key
  }
  const recursivelyGetFields = (
    key: string,
    value: Record<string, wire.ViewOnlyField> | wire.WireFieldDefinitionMap,
  ) =>
    Object.entries(value)
      .map(([key2, value2]) => [`${key}${PATH_ARROW}${key2}`, value2])
      .flatMap(([key, value]) =>
        getFields(
          key as string,
          value as wire.ViewOnlyField | wire.WireFieldDefinition,
        ),
      )

  return Object.entries(fields)
    .flatMap(([key, value]) => getFields(key, value))
    .map((el) => ({ value: el, label: el }) as wire.SelectOption)
}

const getWireDef = (
  property: FieldProperty | FieldsProperty,
  context: context.Context,
  currentValue: wire.PlainWireRecord,
  path: FullPath,
) => {
  let wireId: string | undefined
  if (property.wireField) {
    wireId = getObjectProperty(currentValue, property.wireField) as string
  } else if (property.wireName) {
    wireId = property.wireName
  } else if (property.wirePath) {
    wireId = getGrouping(path, context, property.wirePath)
  }
  return wireId === undefined ? undefined : getWireDefinition(context, wireId)
}

const fieldHandler: PropertyTypeHandler = {
  getField: (
    property: FieldProperty | FieldsProperty,
    context,
    currentValue,
    path,
  ) => {
    const wireDefinition = getWireDef(property, context, currentValue, path)
    return getBaseWireFieldDef(property, "SELECT", {
      selectlist: getSelectListMetadataFromOptions(
        property.name,
        getWireFieldSelectOptions(wireDefinition),
        "",
      ),
    })
  },
}

const fieldsHandler: PropertyTypeHandler = {
  getField: (
    property: FieldProperty | FieldsProperty,
    context,
    currentValue,
    path,
  ) => {
    const wireDefinition = getWireDef(property, context, currentValue, path)
    return getBaseWireFieldDef(property, "MULTISELECT", {
      selectlist: getSelectListMetadataFromOptions(
        property.name,
        getWireFieldSelectOptions(wireDefinition),
      ),
    })
  },
  getValue: stringListValueGetter,
  getSetters: (def, property, context, initialValue, path) => {
    if (property.viewOnly) return []
    const name = getPropertyId(property)
    const [propPath] = getPropPathFromName(name, path)
    return [getStringListSetter(propPath, context)]
  },
}

export { fieldHandler, fieldsHandler }
