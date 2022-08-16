import { selectors, setMany } from "../../src/bands/metadatatext"
import { AnyAction } from "redux"
import { platform } from "../../src/platform/platform"
import { create } from "../../src/store/store"
import { makeFullPath } from "../../src/component/path"

const TEST_VIEW = "ben/planets.page"
const TEST_TYPE = "viewdef"

const getTestPath = (path: string) => makeFullPath(TEST_TYPE, TEST_VIEW, path)

const testTextAction = (data: string, action: AnyAction) => {
	const store = create(platform, {})
	const initialItem = {
		content: data,
		key: TEST_VIEW,
		metadatatype: TEST_TYPE,
	}
	store.dispatch(setMany([initialItem]))
	store.dispatch(action)
	const itemToCheck = selectors.selectById(
		store.getState(),
		`${TEST_TYPE}:${TEST_VIEW}`
	)
	if (!itemToCheck) throw new Error("no item found")
	return itemToCheck.content.trim()
}

export { testTextAction, getTestPath }
