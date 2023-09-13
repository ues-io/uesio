import { Bundleable } from "../metadata/types"
import type { DefinitionMap } from "./definition"

export const Declarative = "DECLARATIVE"
export const React = "REACT"
type ReactType = typeof React | ""
export type ComponentType = typeof Declarative | ReactType

interface BaseComponent extends Bundleable {
	type: ComponentType
	slots?: SlotDef[]
}

type SlotDef = {
	name: string
}

export interface DeclarativeComponent extends BaseComponent {
	type: typeof Declarative
	definition: DefinitionMap
}

export interface ReactComponent extends BaseComponent {
	type: ReactType
}

export type Component = DeclarativeComponent | ReactComponent
