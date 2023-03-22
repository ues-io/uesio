import { useConfigValue as useCV } from "../bands/configvalue"
import { getViewDef, upsertOne, useViewDef } from "../bands/viewdef"
import { parseKey } from "../component/path"
import { ViewDefinition } from "../definition/viewdef"
import { dispatch } from "../store/store"

const useConfigValue = (key: string) => useCV(key)?.value || ""

const setViewDefinition = (key: string, definition: ViewDefinition) => {
	const [namespace, name] = parseKey(key)
	dispatch(
		upsertOne({
			name,
			namespace,
			definition,
		})
	)
}

export { useViewDef, getViewDef, useConfigValue, setViewDefinition }
