import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const listHandler: PropertyTypeHandler = {
	getField: (property) => getBaseWireFieldDef(property, "LIST"),
	getSetters: () => [],
}

export { listHandler }
