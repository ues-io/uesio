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
import ErrorBoundary from "./components/errorboundary"
import ErrorMessage from "./components/errormessage"
const COMPONENT_ID = "uesio.id"
const DISPLAY_CONDITIONS = "uesio.display"

export type {
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
