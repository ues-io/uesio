import { platform } from "../platform/platform"
import { memoizedAsync } from "../platform/memoizedAsync"
import usePlatformFunc from "./useplatformfunc"

const {
	loadData,
	getMonacoEditorVersion,
	getStaticAssetsPath,
	getStaticAssetsHost,
} = platform

export {
	loadData,
	getMonacoEditorVersion,
	getStaticAssetsPath,
	getStaticAssetsHost,
	memoizedAsync,
	usePlatformFunc,
}
