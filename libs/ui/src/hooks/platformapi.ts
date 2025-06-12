import { platform } from "../platform/platform"
import { memoizedAsync } from "../platform/memoizedAsync"
import usePlatformFunc from "./useplatformfunc"

const { loadData, getStaticAssetsPath, getStaticAssetsHost, getFileText } =
  platform

export {
  loadData,
  getFileText,
  getStaticAssetsPath,
  getStaticAssetsHost,
  memoizedAsync,
  usePlatformFunc,
}
