import { BundleableBase } from "../metadata/types"

export type FeatureFlagState = {
	value: string
	type: "CHECKBOX" | "NUMBER"
} & BundleableBase
