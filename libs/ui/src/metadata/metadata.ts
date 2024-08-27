import { Keyable, METADATA } from "./types"

const getKey = <T extends Keyable>(item: T) =>
	`${item.namespace ? item.namespace + "." : ""}${item.name}`

export { getKey, METADATA }
