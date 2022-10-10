import { MetadataKey } from "../bands/builder/types"
import { DefinitionMap } from "./definition"

export type ComponentVariant = {
	name: string
	namespace: string
	label: string
	extends?: string
	component: MetadataKey
	definition: DefinitionMap
}
