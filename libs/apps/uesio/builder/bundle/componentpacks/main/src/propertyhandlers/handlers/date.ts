import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const dateHandler: PropertyTypeHandler = {
	getField: (property) => getBaseWireFieldDef(property, "DATE"),
}

export { dateHandler }
