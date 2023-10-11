import { Bundleable, METADATA } from "./types"

const getKey = (item: Bundleable) =>
	`${item.namespace ? item.namespace + "." : ""}${item.name}`

export { getKey, METADATA }
