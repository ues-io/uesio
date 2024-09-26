import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const longtextHandler: PropertyTypeHandler = {
	getField: (property) => getBaseWireFieldDef(property, "LONGTEXT"),
}

export { longtextHandler }
