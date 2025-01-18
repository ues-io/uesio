import { Bundleable, MetadataKey } from "../metadata/types"
import { FieldValue } from "../wireexports"
import type { DefinitionList } from "./definition"
import { SignalDefinition } from "./signal"

export const Declarative = "DECLARATIVE"
export const React = "REACT"
type ReactType = typeof React | ""
export type ComponentType = typeof Declarative | ReactType

interface BaseComponent extends Bundleable {
  type: ComponentType
  slots?: SlotDef[]
  properties?: ComponentProperty[]
  defaultVariant?: MetadataKey
}

export type ComponentProperty = {
  name: string
  defaultValue?: FieldValue
}

interface WireContextProvision {
  type: "WIRE"
  wireProperty: string
}

interface RecordContextProvision {
  type: "RECORD"
  wireProperty: string
}

interface FieldModeContextProvision {
  type: "FIELD_MODE"
  modeProperty: string
}

type SlotContextProvision =
  | WireContextProvision
  | RecordContextProvision
  | FieldModeContextProvision

type SlotDirection = "VERTICAL" | "HORIZONTAL"

export type SlotDef = {
  name: string
  path?: string
  providesContexts?: SlotContextProvision[]
  defaultContent?: DefinitionList
  label?: string
  direction?: SlotDirection
  onSelectSignals?: SignalDefinition[]
}

export interface DeclarativeComponent extends BaseComponent {
  type: typeof Declarative
  definition: DefinitionList
}

export interface ReactComponent extends BaseComponent {
  type: ReactType
}

export type Component = DeclarativeComponent | ReactComponent
