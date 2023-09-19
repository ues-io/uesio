import Slot, {
	DefaultSlotDirection,
	DefaultSlotName,
	SlotUtilityProps,
	getSlotProps,
} from "./utilities/slot"
import {
	ViewArea,
	ViewComponentDefinition,
	ViewComponentId,
} from "./components/view"
import NotificationArea from "./utilities/notificationarea"
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
import { Component as ComponentDef, Declarative } from "./definition/component"
import ErrorBoundary from "./utilities/errorboundary"
import ErrorMessage from "./utilities/errormessage"
import { SlotComponentId } from "./components/slot"
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
	Declarative,
	DefaultSlotName,
	DefaultSlotDirection,
	Slot,
	SlotComponentId,
	ErrorMessage,
	ErrorBoundary,
	getSlotProps,
	ViewArea,
	ViewComponentId,
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
