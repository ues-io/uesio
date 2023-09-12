import type { BundleableBase } from "../metadata/types"
import type { ViewDefinition } from "./ViewDefinition"

export type ViewMetadata = BundleableBase & {
	definition: ViewDefinition
	public?: boolean
	namespace?: string
}
