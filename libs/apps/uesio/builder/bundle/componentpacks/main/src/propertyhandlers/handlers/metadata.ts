import {
  MetadataProperty,
  MultiMetadataProperty,
} from "../../properties/componentproperty"
import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const metadataHandler: PropertyTypeHandler = {
  getField: (property: MetadataProperty | MultiMetadataProperty) =>
    getBaseWireFieldDef(property, property.type, {
      metadata: {
        type: property.metadata.type,
        // grouping will be merged in at render time
        // into the uesio/io.field layout component property
      },
    }),
}

export { metadataHandler }
