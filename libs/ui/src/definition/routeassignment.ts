import { BundleableBase } from "../metadata/types"

export type RouteAssignmentState = {
	type: string
	namespace: string
	collection: string
	path: string
	label: string
	icon?: string
} & BundleableBase
