import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const componentIdHandler: PropertyTypeHandler = {
  getField: (property) =>
    getBaseWireFieldDef(property, "TEXT", {
      label: "Component Id",
    }),
}

export { componentIdHandler }
