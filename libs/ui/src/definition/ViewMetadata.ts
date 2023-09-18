import { Namespace } from "../metadata/types"
import type { ViewDefinition } from "./ViewDefinition"

export type ViewMetadata = {
	name: string
	namespace: Namespace
	definition: ViewDefinition
	public?: boolean
}
