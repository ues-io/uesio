import { BundleableBase } from "../metadata/types"

export type RouteAssignmentState = {
	type: string
	namespace: string
	collection: string
	path: string
	collectionLabel: string
	collectionPluralLabel: string
	collectionIcon?: string
} & BundleableBase
