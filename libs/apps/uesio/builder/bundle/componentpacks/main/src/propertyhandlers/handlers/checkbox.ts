import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const checkboxHandler: PropertyTypeHandler = {
  getField: (property) => getBaseWireFieldDef(property, "CHECKBOX"),
}

export { checkboxHandler }
