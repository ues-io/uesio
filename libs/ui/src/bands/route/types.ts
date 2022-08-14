import { EntityState } from "@reduxjs/toolkit"
import { ComponentPackState } from "../../definition/componentpack"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { LabelState } from "../../definition/label"
import { ThemeState } from "../../definition/theme"
import { PlainViewDef } from "../../definition/viewdef"
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
	label?: EntityState<LabelState>
	metadatatext?: EntityState<MetadataState>
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
