import { BundleableBase } from "../metadata/types"

export type ComponentPackState = {
  updatedAt: number
  hasStyles: boolean
  siteOnly: boolean
} & BundleableBase
