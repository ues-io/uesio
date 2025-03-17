import type { FC, ReactNode } from "react"
import type { Keyable, MetadataKey } from "../metadata/types"
import type { DisplayCondition } from "../component/display"
import type { Context } from "../context/context"
import type { ComponentSignalDescriptor } from "./signal"
import { WireDefinitionMap } from "./wire"
import { PanelDefinitionMap } from "./panel"
import { ViewEventsDef } from "./view"
import { ViewParamDefinition } from "./param"
import { SlotDef } from "./component"

export type BaseDefinition<T = DefinitionMap> = {
  "uesio.id"?: string
  "uesio.styleTokens"?: Record<string, string[]>
  "uesio.variant"?: MetadataKey
  "uesio.display"?: DisplayCondition[]
  "uesio.classes"?: Record<string, DisplayCondition[]>
} & T

export type ImportMapping = {
  type: "IMPORT" | "VALUE"
  columnname?: string
  value?: string
}

export type Spec = ImportSpec | ExportSpec | UploadSpec

export type ImportSpec = {
  jobtype: "IMPORT"
  collection: string
  filetype: "CSV" | "TAB" | undefined
  mappings: Record<string, ImportMapping>
}

export type ExportSpec = {
  jobtype: "EXPORT"
  collection: string
  filetype: "CSV"
}

export type UploadSpec = {
  jobtype: "UPLOADFILES"
  collection: string
  uploadfield?: string
}

export type BaseProps<T = DefinitionMap> = {
  definition: BaseDefinition<T>
  path: string
  componentType?: MetadataKey
  context: Context
  children?: ReactNode
}

export type UC<T = DefinitionMap> = FC<BaseProps<T>> & {
  signals?: Record<string, ComponentSignalDescriptor>
}

export type UtilityComponent<T = DefinitionMap> = FC<T & UtilityProps>

export interface UtilityProps {
  id?: string
  variant?: MetadataKey
  styleTokens?: Record<string, string[]>
  classes?: Record<string, string>
  className?: string
  context: Context
  children?: ReactNode
}

export type DefinitionMap = Record<string, unknown>

export type DefinitionList = DefinitionMap[]

export type DefinitionValue = unknown

export type Definition =
  | DefinitionValue
  | DefinitionMap
  | DefinitionValue[]
  | DefinitionMap[]

export type ViewDefinition = {
  components: DefinitionList | null | undefined
  wires?: WireDefinitionMap | null
  panels?: PanelDefinitionMap | null
  events?: ViewEventsDef
  params?: Record<string, ViewParamDefinition> | null
  slots?: SlotDef[] | null
}

export type ViewMetadata = {
  definition: ViewDefinition
  public?: boolean
} & Keyable
