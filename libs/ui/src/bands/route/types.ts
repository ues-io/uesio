import { EntityState } from "@reduxjs/toolkit"
import { ComponentPackState } from "../../definition/componentpack"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { FeatureFlagState } from "../../definition/featureflag"
import { LabelState } from "../../definition/label"
import { ThemeState } from "../../definition/theme"
import { PlainViewDef } from "../../definition/viewdef"
import { MetadataKey } from "../builder/types"
import { PlainCollection } from "../collection/types"
import { ComponentState } from "../component/types"
import { MetadataState } from "../metadata/types"
import { PlainWire } from "../wire/types"

type WorkspaceState = {
	name: string
	app: string
	wrapper?: MetadataKey
	slotwrapper?: MetadataKey
}

type SiteAdminState = {
	name: string
	app: string
}

type Dependencies = {
	theme?: EntityState<ThemeState>
	viewdef?: EntityState<PlainViewDef>
	componentvariant?: EntityState<ComponentVariant>
	component?: EntityState<ComponentState>
	componentpack?: EntityState<ComponentPackState>
	configvalue?: EntityState<ConfigValueState>
	featureflag?: EntityState<FeatureFlagState>
	label?: EntityState<LabelState>
	metadatatext?: EntityState<MetadataState>
	wire?: EntityState<PlainWire>
	collection?: EntityState<PlainCollection>
}

type RouteState = {
	view: string
	params?: Record<string, string>
	namespace: string
	path: string
	workspace?: WorkspaceState
	theme: string
	isLoading?: boolean
	dependencies?: Dependencies
} | null

export { RouteState, WorkspaceState, SiteAdminState, Dependencies }
