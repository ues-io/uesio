import { Keyable } from "../metadata/types"
import type { ViewDefinition } from "./ViewDefinition"

export type ViewMetadata = {
	definition: ViewDefinition
	public?: boolean
} & Keyable
