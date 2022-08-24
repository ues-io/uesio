import { EntityState } from "@reduxjs/toolkit"
import { ComponentPackState } from "../../definition/componentpack"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { FeatureFlagState } from "../../definition/featureflag"
import { LabelState } from "../../definition/label"
import { ThemeState } from "../../definition/theme"
import { PlainViewDef } from "../../definition/viewdef"
import { MetadataInfo } from "../../platform/platform"
import { MetadataState } from "../metadata/types"

type TenantState = {
	name: string
	app: string
}

type Dependencies = {
	theme?: EntityState<ThemeState>
	viewdef?: EntityState<PlainViewDef>
	componentvariant?: EntityState<ComponentVariant>
	componentpack?: EntityState<ComponentPackState>
	configvalue?: EntityState<ConfigValueState>
	featureflag?: EntityState<FeatureFlagState>
	label?: EntityState<LabelState>
	metadatatext?: EntityState<MetadataState>
	namespaces?: Record<string, MetadataInfo>
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
