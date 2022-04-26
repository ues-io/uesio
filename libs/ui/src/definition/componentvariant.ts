import { DefinitionMap } from "./definition"

export type ComponentVariant = {
	name: string
	namespace: string
	label: string
	extends?: string
	component: string
	definition: DefinitionMap
}
