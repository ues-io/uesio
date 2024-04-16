import { changeKey, getDefAtPath } from "../../api/defapi"
import { PropertyTypeHandler, getBaseWireFieldDef } from "../handlerutils"

const keyHandler: PropertyTypeHandler = {
	getField: (property) => getBaseWireFieldDef(property, "TEXT"),
	getValue: (def, property, context, initialValue, path) => {
		const [key] = path.pop()
		return key || getDefAtPath(def, path)
	},
	getSetters: (def, property, context, initialValue, path) => [
		(value: string) => changeKey(context, path, value),
	],
}

export { keyHandler }
