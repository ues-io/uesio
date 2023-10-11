import type { ViewDefinition } from "./ViewDefinition"

export type ViewMetadata = {
	name: string
	namespace?: string
	definition: ViewDefinition
	public?: boolean
}
