import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const mapHandler: PropertyTypeHandler = {
  getField: (property) => getBaseWireFieldDef(property, "MAP"),
  getSetters: () => [],
}

export { mapHandler }
