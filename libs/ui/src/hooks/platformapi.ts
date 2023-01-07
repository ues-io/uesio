import { platform } from "../platform/platform"
const loadData = platform.loadData

// Hack for Monaco loader to be able to load assets from custom paths
interface UesioWindow extends Window {
	uesioStaticAssetsPath: string
}

const getStaticAssetsPath = () =>
	(window as unknown as UesioWindow).uesioStaticAssetsPath

export { loadData, getStaticAssetsPath }
