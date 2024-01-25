import { Component } from "../componenttype/types"
import { ComponentPackState } from "../../definition/componentpack"
import { ComponentState } from "../component/types"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { FeatureFlagState } from "../../definition/featureflag"
import { FileState } from "../../definition/file"
import { LabelState } from "../../definition/label"
import { MetadataKey } from "../../metadata/types"
import { PlainCollection } from "../collection/types"
import { SelectListMetadata } from "../../wireexports"
import { ServerWire } from "../wire/types"
import { ThemeState } from "../../definition/theme"
import { ViewMetadata } from "../../definition/ViewMetadata"

type WorkspaceState = {
	name: string
	app: string
	wrapper?: MetadataKey
}

type SiteAdminState = {
	name: string
	app: string
}

type Dependencies = {
	collection?: PlainCollection[]
	component?: ComponentState[]
	componentpack?: ComponentPackState[]
	componenttype?: Component[]
	componentvariant?: ComponentVariant[]
	configvalue?: ConfigValueState[]
	featureflag?: FeatureFlagState[]
	file?: FileState[]
	label?: LabelState[]
	selectlist?: SelectListMetadata[]
	theme?: ThemeState[]
	viewdef?: ViewMetadata[]
	wire?: ServerWire[]
}

type RouteTag = {
	location: string
	type: string
	name: string
	content: string
}

type RouteState = {
	batchid?: string
	dependencies?: Dependencies
	isLoading?: boolean
	namespace: string
	params?: Record<string, string>
	path: string
	tags?: RouteTag[]
	theme: string
	title?: string
	view: string
	workspace?: WorkspaceState
}

export type {
	RouteState,
	RouteTag,
	WorkspaceState,
	SiteAdminState,
	Dependencies,
}
