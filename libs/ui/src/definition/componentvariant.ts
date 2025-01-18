import type { MetadataKey } from "../metadata/types"
import { BundleableBase } from "../metadataexports"
import type { DefinitionMap } from "./definition"

export type ComponentVariant = {
  label: string
  extends?: string
  component: MetadataKey
  definition: DefinitionMap
} & BundleableBase
