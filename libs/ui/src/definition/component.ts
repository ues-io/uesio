import { Bundleable } from "../metadata/types"
import type { DefinitionMap } from "./definition"

export const Declarative = "DECLARATIVE"
export const React = "REACT"
type ReactType = typeof React | ""
export type ComponentType = typeof Declarative | ReactType

interface BaseComponent extends Bundleable {
	type: ComponentType
}

interface DeclarativeComponent extends BaseComponent {
	type: typeof Declarative
	definition: DefinitionMap
}

interface ReactComponent extends BaseComponent {
	type: ReactType
}

export type Component = DeclarativeComponent | ReactComponent
