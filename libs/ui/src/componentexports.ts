import Slot, { SlotUtilityProps, getSlotProps } from "./components/slot"
import { ViewArea, ViewComponentDefinition } from "./components/view"
import NotificationArea from "./components/notificationarea"
import * as path from "./component/path"
import * as registry from "./component/registry"
import { Component, getUtility } from "./component/component"
import {
	shouldHaveClass,
	useShould,
	shouldAll,
	useShouldFilter,
	useContextFilter,
	ItemContext,
	DisplayCondition,
	DisplayOperator,
} from "./component/display"
import { ComponentVariant } from "./definition/componentvariant"
import { Component as ComponentDef } from "./definition/component"
import ErrorBoundary from "./components/errorboundary"
import ErrorMessage from "./components/errormessage"
const COMPONENT_ID = "uesio.id"
const DISPLAY_CONDITIONS = "uesio.display"
const STYLE_VARIANT = "uesio.variant"
const STYLE_TOKENS = "uesio.styleTokens"

export type {
	ComponentDef,
	SlotUtilityProps,
	ComponentVariant,
	ItemContext,
	DisplayCondition,
	DisplayOperator,
	ViewComponentDefinition,
}

export {
	DISPLAY_CONDITIONS,
	COMPONENT_ID,
	STYLE_VARIANT,
	STYLE_TOKENS,
	Slot,
	ErrorMessage,
	ErrorBoundary,
	getSlotProps,
	ViewArea,
	path,
	registry,
	getUtility,
	Component,
	NotificationArea,
	shouldHaveClass,
	useShould,
	shouldAll,
	useShouldFilter,
	useContextFilter,
}
