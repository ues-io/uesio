import { ComponentPackState } from "../../definition/componentpack"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { FeatureFlagState } from "../../definition/featureflag"
import { LabelState } from "../../definition/label"
import { ThemeState } from "../../definition/theme"
import { ViewMetadata } from "../../definition/ViewMetadata"
import { MetadataKey } from "../../metadata/types"
import { PlainCollection } from "../collection/types"
import { ComponentState } from "../component/types"
import { ServerWire } from "../wire/types"
import { Component } from "../componenttype/types"
import { FileState } from "../../definition/file"

type WorkspaceState = {
	id: string
	name: string
	app: string
	wrapper?: MetadataKey
}

type SiteAdminState = {
	name: string
	app: string
}

type Dependencies = {
	theme?: ThemeState[]
	viewdef?: ViewMetadata[]
	componentvariant?: ComponentVariant[]
	component?: ComponentState[]
	componenttype?: Component[]
	componentpack?: ComponentPackState[]
	configvalue?: ConfigValueState[]
	featureflag?: FeatureFlagState[]
	label?: LabelState[]
	wire?: ServerWire[]
	collection?: PlainCollection[]
	file?: FileState[]
}

type RouteTag = {
	location: string
	type: string
	name: string
	content: string
}

type RouteState = {
	view: string
	params?: Record<string, string>
	namespace: string
	path: string
	workspace?: WorkspaceState
	theme: string
	title: string
	isLoading?: boolean
	dependencies?: Dependencies
	tags: RouteTag[]
	batchid?: string
}

export type {
	RouteState,
	RouteTag,
	WorkspaceState,
	SiteAdminState,
	Dependencies,
}
