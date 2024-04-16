import { context, wire } from "@uesio/ui"
import { getDefAtPath, get as getDef, set as setDef } from "../../api/defapi"

import {
	LODASH_PATH_SEPARATOR,
	PropertyTypeHandler,
	getBaseWireFieldDef,
	getPropPathFromName,
	getPropertyId,
} from "../handlerutils"
import set from "lodash/set"
import { FullPath } from "../../api/path"

const getNestedSetter =
	(nameParts: string[], context: context.Context, path: FullPath) =>
	(value: wire.PlainFieldValue) => {
		// e.g. "foo->bar" becomes ["foo", "bar"]
		const [firstPart, ...rest] = nameParts
		const wrapperPath = path.addLocal(firstPart)
		// e.g. get the current value of "foo", if any
		let wrapperValue = getDef(context, wrapperPath) as wire.PlainWireRecord
		// If wrapper value is not an object, it's corrupted
		if (typeof wrapperValue !== "object") {
			wrapperValue = {} as wire.PlainWireRecord
		} else {
			wrapperValue = structuredClone(wrapperValue) as wire.PlainWireRecord
		}
		// Populate the JSON representation with the new value first,
		// e.g. foo = { "bar": "baz" } ==> { "bar": value }
		set(wrapperValue, rest.join(LODASH_PATH_SEPARATOR), value)

		// Invoke the def api to update YAML with the wrapper value object
		setDef(context, path.addLocal(firstPart), wrapperValue)
	}

const getStandardSetter =
	(propPath: FullPath, context: context.Context) =>
	(value: wire.PlainFieldValue) => {
		// Invoke def api to update YAML
		setDef(context, propPath, value)
	}

const textHandler: PropertyTypeHandler = {
	getField: (property) => getBaseWireFieldDef(property, "TEXT"),
	getValue: (def, property, context, initialValue, path) => {
		const [propPath] = getPropPathFromName(property.name, path)
		return getDefAtPath(def, propPath)
	},
	getSetters: (def, property, context, initialValue, path) => {
		if (property.viewOnly) return []
		const name = getPropertyId(property)
		const [propPath, nameParts, isNestedProperty] = getPropPathFromName(
			name,
			path
		)
		return [
			isNestedProperty
				? getNestedSetter(nameParts, context, path)
				: getStandardSetter(propPath, context),
		]
	},
}

export { textHandler }
