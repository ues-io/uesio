import { DefinitionMap } from "../../definition/definition"
// interface ComponentVariant<T = unknown> {
// 	id: string
// 	name: string
// 	component: string
// 	label: string
// 	definition: T
// 	componentType: string
// }

export type ComponentVariant = {
	name: string
	namespace: string
	label: string
	component: string
	definition: DefinitionMap
}
