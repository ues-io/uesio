import { platform } from "../platform/platform"
import { memoizedAsync } from "../platform/memoizedAsync"
import usePlatformFunc from "./useplatformfunc"

const {
  loadData,
  getMonacoEditorVersion,
  getStaticAssetsPath,
  getStaticAssetsHost,
  getFileText,
} = platform

export {
  loadData,
  getFileText,
  getMonacoEditorVersion,
  getStaticAssetsPath,
  getStaticAssetsHost,
  memoizedAsync,
  usePlatformFunc,
}
