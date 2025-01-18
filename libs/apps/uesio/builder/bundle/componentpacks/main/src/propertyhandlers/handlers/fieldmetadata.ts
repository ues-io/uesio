import { wire } from "@uesio/ui"
import { getDefAtPath, set as setDef } from "../../api/defapi"
import { FieldMetadataProperty } from "../../properties/componentproperty"
import {
  PropertyTypeHandler,
  getBaseWireFieldDef,
  getClosestWireInContext,
  getObjectProperty,
  getPropPathFromName,
  getPropertyId,
} from "../handlerutils"
import { FullPath } from "../../api/path"
import { PropertyPath } from "lodash"
import get from "lodash/get"
import { getFieldMetadata } from "../../api/wireapi"

const getSourceField = (
  def: unknown,
  property: FieldMetadataProperty,
  currentValue: wire.PlainWireRecord,
  path: FullPath,
) =>
  (getDefAtPath(def, path.addLocal(property.fieldProperty)) as string) ||
  (getObjectProperty(currentValue, property.fieldProperty) as string)

const getSourceWire = (
  def: unknown,
  property: FieldMetadataProperty,
  currentValue: wire.PlainWireRecord,
  path: FullPath,
) => {
  let sourceWire = property.wireName as string
  if (!sourceWire && property.wireProperty) {
    sourceWire =
      (getDefAtPath(def, path.addLocal(property.wireProperty)) as string) ||
      (getObjectProperty(currentValue, property.wireProperty) as string)
  }
  if (!sourceWire) {
    sourceWire = getClosestWireInContext(def, path) as string
  }
  return sourceWire
}

const fieldMetadataHandler: PropertyTypeHandler = {
  getField: (property) => getBaseWireFieldDef(property, "TEXT"),
  getValue: (
    def,
    property: FieldMetadataProperty,
    context,
    initialValue,
    path,
  ) => {
    const sourceField = getSourceField(def, property, initialValue, path)
    const sourceWire = getSourceWire(def, property, initialValue, path)
    // Get the initial value of the corresponding field metadata property
    return get(
      getFieldMetadata(context, sourceWire, sourceField)?.source,
      property.metadataProperty as PropertyPath,
    )
  },
  getSetters: (
    def,
    property: FieldMetadataProperty,
    context,
    initialValue,
    path,
  ) => {
    const name = getPropertyId(property)
    const [propPath] = getPropPathFromName(name, path)
    const sourceField = getSourceField(def, property, initialValue, path)
    const sourceWire = getSourceWire(def, property, initialValue, path)

    if (sourceField && sourceWire) {
      // Add a setter to the source field so that whenever it changes, we also update this property
      const metadataSetter = (
        newFieldId: string,
        _fieldBeingUpdated: string,
        record: wire.WireRecord,
      ) => {
        const newFieldMetadataProperty = get(
          getFieldMetadata(context, sourceWire, newFieldId)?.source,
          property.metadataProperty as PropertyPath,
        ) as string
        if (newFieldMetadataProperty !== undefined) {
          // Update in-memory representation for this field, since we are computing it here,
          // we need to apply it to the record
          record?.update(name, newFieldMetadataProperty, context)
          if (property.viewOnly) return
          // Update YAML
          setDef(context, propPath, newFieldMetadataProperty)
        }
      }
      return [metadataSetter]
    }
    return []
  },
}

export { fieldMetadataHandler }
