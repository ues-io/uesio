import Slot, { SlotUtilityProps, getSlotProps } from "./components/slot"
import View from "./components/view"
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
import PanelArea from "./components/panelarea"
import ErrorBoundary from "./components/errorboundary"

export type {
	SlotUtilityProps,
	ComponentVariant,
	ItemContext,
	DisplayCondition,
	DisplayOperator,
}

export {
	Slot,
	ErrorBoundary,
	getSlotProps,
	View,
	path,
	registry,
	getUtility,
	Component,
	PanelArea,
	NotificationArea,
	shouldHaveClass,
	useShould,
	shouldAll,
	useShouldFilter,
	useContextFilter,
}
