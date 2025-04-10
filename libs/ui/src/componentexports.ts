import Slot, {
  DefaultSlotName,
  SlotUtilityProps,
  getSlotProps,
} from "./utilities/slot"
import {
  ViewArea,
  ViewComponentDefinition,
  ViewComponentId,
} from "./components/view"
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
import {
  Component as ComponentDef,
  Declarative,
  SlotDef,
} from "./definition/component"
import ErrorBoundary from "./utilities/errorboundary"
import ErrorMessage from "./utilities/errormessage"
import { SlotComponentId } from "./components/slot"
import { ViewDefinition } from "./definition/definition"
import { ComponentState } from "./bands/component/types"
const COMPONENT_ID = "uesio.id"
const COMPONENT_CONTEXT = "uesio.context"
const DISPLAY_CONDITIONS = "uesio.display"
const SIGNAL_CONDITIONS = "uesio.conditions"
const STYLE_VARIANT = "uesio.variant"
const STYLE_TOKENS = "uesio.styleTokens"

export type {
  ComponentDef,
  ComponentVariant,
  ComponentState,
  DisplayCondition,
  DisplayOperator,
  ItemContext,
  SlotUtilityProps,
  SlotDef,
  ViewComponentDefinition,
  ViewDefinition,
}

export {
  DISPLAY_CONDITIONS,
  COMPONENT_CONTEXT,
  SIGNAL_CONDITIONS,
  COMPONENT_ID,
  STYLE_VARIANT,
  STYLE_TOKENS,
  Declarative,
  DefaultSlotName,
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
  shouldHaveClass,
  useShould,
  shouldAll,
  useShouldFilter,
  useContextFilter,
}
