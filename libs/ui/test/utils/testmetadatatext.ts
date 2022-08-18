import { selectors, setMany } from "../../src/bands/metadatatext"
import {
	selectors as viewSelectors,
	setMany as viewSetMany,
} from "../../src/bands/viewdef"
import { AnyAction } from "redux"
import { platform } from "../../src/platform/platform"
import { create } from "../../src/store/store"
import { makeFullPath, parseKey } from "../../src/component/path"
import { parse } from "../../src/yamlutils/yamlutils"

const TEST_VIEW = "ben/planets.page"
const TEST_TYPE = "viewdef"

const getTestPath = (path: string) => makeFullPath(TEST_TYPE, TEST_VIEW, path)

const testTextAction = (data: string, expected: string, action: AnyAction) => {
	const store = create(platform, {})
	const initialItem = {
		content: data,
		key: TEST_VIEW,
		metadatatype: TEST_TYPE,
	}
	const [namespace, name] = parseKey(TEST_VIEW)
	const initialParsed = parse(data).toJSON()
	const expectedParsed = parse(expected).toJSON()

	const initialViewDef = {
		definition: initialParsed,
		namespace,
		name,
	}
	store.dispatch(setMany([initialItem]))
	store.dispatch(viewSetMany([initialViewDef]))
	store.dispatch(action)
	const state = store.getState()
	const itemToCheck = selectors.selectById(state, `${TEST_TYPE}:${TEST_VIEW}`)
	if (!itemToCheck) throw new Error("no item found")
	const viewToCheck = viewSelectors.selectById(state, TEST_VIEW)
	if (!viewToCheck) throw new Error("no viewdef found")
	expect(itemToCheck.content.trim()).toStrictEqual(expected.trim())
	expect(viewToCheck.definition).toEqual(expectedParsed)
}

export { testTextAction, getTestPath }
