import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const collectionFieldHandler: PropertyTypeHandler = {
	getField: (property) => getBaseWireFieldDef(property, "TEXT"),
}

export { collectionFieldHandler }
