import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const numberHandler: PropertyTypeHandler = {
  getField: (property) => getBaseWireFieldDef(property, "NUMBER"),
}

export { numberHandler }
