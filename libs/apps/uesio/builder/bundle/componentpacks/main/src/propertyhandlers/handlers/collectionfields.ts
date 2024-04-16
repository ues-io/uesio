import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const collectionFieldsHandler: PropertyTypeHandler = {
	getField: (property) =>
		getBaseWireFieldDef(property, "LIST", {
			subtype: "TEXT",
		}),
}

export { collectionFieldsHandler }
