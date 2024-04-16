import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const textareaHandler: PropertyTypeHandler = {
	getField: (property) => getBaseWireFieldDef(property, "LONGTEXT"),
}

export { textareaHandler }
