import type { ViewDefinition, ViewMetadata } from "./definition"
import type { SignalDefinition } from "./signal"

type PlainViewDefMap = {
	[key: string]: ViewMetadata
}

type ViewEventsDef = {
	onload: SignalDefinition[]
}

export type {
	ViewMetadata as PlainViewDef,
	PlainViewDefMap,
	ViewDefinition,
	ViewEventsDef,
}
