import { EntityState } from "@reduxjs/toolkit"
import { FeatureFlagState } from "../featureflag/types"
import { MetadataState } from "../metadata/types"

type TenantState = {
	name: string
	app: string
}

type Dependencies = {
	theme?: EntityState<MetadataState>
	viewdef?: EntityState<MetadataState>
	componentvariant?: EntityState<MetadataState>
	componentpack?: EntityState<MetadataState>
	configvalue?: EntityState<MetadataState>
	label?: EntityState<MetadataState>
	featureflag?: EntityState<FeatureFlagState>
}

type RouteState = {
	view: string
	params?: Record<string, string>
	namespace: string
	path: string
	workspace?: TenantState
	theme: string
	isLoading?: boolean
	dependencies?: Dependencies
} | null

export { RouteState, TenantState, Dependencies }
