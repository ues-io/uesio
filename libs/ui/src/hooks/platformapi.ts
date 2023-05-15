import { platform } from "../platform/platform"
import { memoizedAsync } from "../platform/memoizedAsync"
const {
	loadData,
	getMonacoEditorVersion,
	getStaticAssetsPath,
	getVendorAssetsPath,
} = platform

export {
	loadData,
	getMonacoEditorVersion,
	getStaticAssetsPath,
	getVendorAssetsPath,
	memoizedAsync,
}
