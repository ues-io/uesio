import { wire } from "@uesio/ui"
import { StructProperty } from "../../properties/componentproperty"
import { get as getDef, set as setDef } from "../../api/defapi"
import {
  LODASH_PATH_SEPARATOR,
  PATH_ARROW,
  PropertyTypeHandler,
  getBaseWireFieldDef,
  getPropPathFromName,
  getPropertyId,
  getWireFields,
} from "../handlerutils"
import set from "lodash/set"

const structHandler: PropertyTypeHandler = {
  getField: (property: StructProperty, context, currentValue, path) => {
    const wireField = getBaseWireFieldDef(property, "STRUCT")
    // Process each subField of STRUCT fields as separate subfield
    wireField.fields = getWireFields(
      property.properties,
      context,
      (currentValue || {}) as wire.PlainWireRecord,
      path,
    )
    return wireField
  },
  getSetters: (def, property, context, currentValue, path) => {
    if (property.viewOnly) return []
    const name = getPropertyId(property)
    const [propPath] = getPropPathFromName(name, path)
    return [
      (value: wire.PlainFieldValue, field: string) => {
        let newValue: wire.PlainFieldValue | wire.PlainWireRecord = undefined
        // If a specific field was not provided,
        // then we assume we were given the entire struct as our value
        if (!field && typeof value === "object") {
          newValue = value
        } else if (field) {
          // If a specific field was provided, we need to first get our value
          // and then update just a particular field on it
          const currentValue = (getDef(context, propPath) || {}) as Record<
            string,
            wire.PlainWireRecord
          >
          newValue = {
            ...currentValue,
          } as wire.PlainWireRecord
          set(newValue, field.replace(PATH_ARROW, LODASH_PATH_SEPARATOR), value)
        }
        // Update YAML definition
        setDef(context, propPath, newValue)
      },
    ]
  },
}

export { structHandler }
