import { BundleableBase } from "../metadata/types"

export type FeatureFlagState = {
  value: string | boolean | number
  type: "CHECKBOX" | "NUMBER"
} & BundleableBase
