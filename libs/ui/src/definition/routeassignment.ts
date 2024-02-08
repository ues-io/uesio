import { BundleableBase } from "../metadata/types"

export type RouteAssignmentState = {
	type: string
	collection: string
	path: string
	collectionLabel: string
	collectionPluralLabel: string
} & BundleableBase
