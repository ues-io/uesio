import type { MetadataKey } from "../metadata/types"
import type { DefinitionList } from "./definition"
import type { SignalDefinition } from "./signal"

export interface PanelDefinition {
  "uesio.type": MetadataKey
  "uesio.styleTokens"?: Record<string, string[]>
  "uesio.variant"?: MetadataKey
  title?: string
  width?: string
  height?: string
  closeOnOutsideClick?: boolean
  components?: DefinitionList
  actions?: DefinitionList
  afterClose?: SignalDefinition[]
}

export type PanelDefinitionMap = Record<string, PanelDefinition>
