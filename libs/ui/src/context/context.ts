import { getCurrentState } from "../store/store"
import {
  RouteState,
  SiteAdminState,
  WorkspaceState,
} from "../bands/route/types"
import { selectors as viewSelectors } from "../bands/viewdef"
import { selectors as labelSelectors } from "../bands/label"
import { selectors as fileSelectors } from "../bands/file"
import { selectors as componentVariantSelectors } from "../bands/componentvariant"
import { selectors as selectListSelectors } from "../bands/selectlist"
import { selectors as routeAssignmentSelectors } from "../bands/routeassignment"
import { selectors as themeSelectors } from "../bands/theme"
import { selectors as featureFlagSelectors } from "../bands/featureflag"
import { selectors as configValueSelectors } from "../bands/configvalue"
import { selectWire } from "../bands/wire"
import Wire from "../bands/wire/class"
import get from "lodash/get"
import { getAncestorPath, parseKey } from "../component/path"
import { FieldValue, PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { MetadataKey } from "../metadata/types"
import { SiteState } from "../bands/site"
import { handlers, MergeOptions, MergeType } from "./merge"
import { getCollection } from "../bands/collection/selectors"
import { SlotDef } from "../definition/component"
import { BaseDefinition } from "../definition/definition"

const ERROR = "ERROR",
  COMPONENT = "COMPONENT",
  RECORD = "RECORD",
  MULTI_RECORD = "MULTI_RECORD",
  THEME = "THEME",
  VIEW = "VIEW",
  ROUTE = "ROUTE",
  FIELD_MODE = "FIELD_MODE",
  WIRE = "WIRE",
  PROPS = "PROPS",
  RECORD_DATA = "RECORD_DATA",
  SIGNAL_OUTPUT = "SIGNAL_OUTPUT"

type FieldMode = "READ" | "EDIT"

type Mergeable = string | number | boolean | undefined
type DeepMergeable = Mergeable | Record<string, Mergeable> | Mergeable[]

interface ErrorContext {
  errors: string[]
}

interface FieldModeContext {
  fieldMode: FieldMode
}

interface WireContext {
  wire: string
  view?: string
}

interface RecordContext {
  view?: string
  wire: string
  record: string
}

interface MultiRecordContext {
  view?: string
  wire: string
  records: string[]
}

interface RecordDataContext {
  recordData: PlainWireRecord // A way to store arbitrary record data in context
  index?: number // the record's zero-indexed position within its parent array/collection
}

interface ViewContext {
  view: string
  viewDef: string
  params?: Record<string, string>
}

interface RouteContext {
  route: RouteState
  theme: string
  view: string
  viewDef: string
}

interface ThemeContext {
  theme: string
}

interface WorkspaceContext {
  workspace: WorkspaceState
}

interface SiteAdminContext {
  siteadmin: SiteAdminState
}

interface SignalOutputContext {
  data: unknown
  errors?: string[]
  label: string
}

interface ComponentContext {
  componentType: string
  data: Record<string, unknown>
}

interface PropsContext {
  componentType: string
  data: BaseDefinition
  path: string
  slots: SlotDef[] | undefined
}

interface ComponentContextFrame extends ComponentContext {
  type: typeof COMPONENT
}

interface PropsContextFrame extends PropsContext {
  type: typeof PROPS
}

interface ThemeContextFrame extends ThemeContext {
  type: typeof THEME
}

interface RouteContextFrame extends RouteContext {
  type: typeof ROUTE
}

interface ViewContextFrame extends ViewContext {
  type: typeof VIEW
}

interface RecordContextFrame extends RecordContext {
  type: typeof RECORD
  // We will throw an error if view is not available at time of construction
  view: string
}

interface MultiRecordContextFrame extends MultiRecordContext {
  type: typeof MULTI_RECORD
  // We will throw an error if view is not available at time of construction
  view: string
}

interface RecordDataContextFrame extends RecordDataContext {
  type: typeof RECORD_DATA
}

interface WireContextFrame extends WireContext {
  type: typeof WIRE
  // We will throw an error if view is not available at time of construction
  view: string
}

interface ErrorContextFrame extends ErrorContext {
  type: typeof ERROR
}

interface FieldModeContextFrame extends FieldModeContext {
  type: typeof FIELD_MODE
}

interface SignalOutputContextFrame extends SignalOutputContext {
  type: typeof SIGNAL_OUTPUT
}

type ContextOptions =
  | SiteAdminContext
  | WorkspaceContext
  | WireContext
  | FieldModeContext

type ContextFrame =
  | RouteContextFrame
  | ComponentContextFrame
  | ThemeContextFrame
  | ViewContextFrame
  | RecordContextFrame
  | MultiRecordContextFrame
  | RecordDataContextFrame
  | WireContextFrame
  | ErrorContextFrame
  | FieldModeContextFrame
  | SignalOutputContextFrame
  | PropsContextFrame

const isContextObject = (o: unknown): o is Context =>
  o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, "stack")

// Type Guards for fully-resolved Context FRAMES (with "type" property appended)
const isErrorContextFrame = (frame: ContextFrame): frame is ErrorContextFrame =>
  frame.type === "ERROR"

const isThemeContextFrame = (
  frame: ContextFrame,
): frame is ThemeContextFrame | RouteContextFrame =>
  [THEME].includes(frame.type)

const isRecordContextFrame = (
  frame: ContextFrame,
): frame is RecordContextFrame => frame.type === RECORD

const isComponentContextFrame = (
  frame: ContextFrame,
): frame is ComponentContextFrame => frame.type === COMPONENT

const isSignalOutputContextFrame = (
  frame: ContextFrame,
): frame is SignalOutputContextFrame => frame.type === SIGNAL_OUTPUT

const providesRecordContext = (
  frame: ContextFrame,
): frame is RecordContextFrame | RecordDataContextFrame =>
  [RECORD, RECORD_DATA].includes(frame.type)

const providesThemeContext = (
  frame: ContextFrame,
): frame is ThemeContextFrame | RouteContextFrame =>
  [THEME, ROUTE].includes(frame.type)

const providesRecordOrMultiRecordContext = (
  frame: ContextFrame,
): frame is
  | RecordContextFrame
  | RecordDataContextFrame
  | MultiRecordContextFrame =>
  [RECORD, RECORD_DATA, MULTI_RECORD].includes(frame.type)

const isFieldModeContextFrame = (
  frame: ContextFrame,
): frame is FieldModeContextFrame => frame.type === FIELD_MODE
const isRecordDataContextFrame = (
  frame: ContextFrame,
): frame is RecordDataContextFrame => frame.type === RECORD_DATA
const isViewContextFrame = (frame: ContextFrame): frame is ViewContextFrame =>
  frame.type === VIEW
const isRouteContextFrame = (frame: ContextFrame): frame is RouteContextFrame =>
  frame.type === ROUTE
const isPropsContextFrame = (frame: ContextFrame): frame is PropsContextFrame =>
  frame.type === PROPS
const hasWireContext = (
  frame: ContextFrame,
): frame is RecordContextFrame | WireContextFrame =>
  [RECORD, WIRE, MULTI_RECORD].includes(frame.type)
const hasViewContext = (
  frame: ContextFrame,
): frame is ViewContextFrame | RouteContextFrame =>
  [VIEW, ROUTE].includes(frame.type)

// Type Guards for pre-resolved Context objects (no type property yet)

const providesWorkspace = (o: ContextOptions): o is WorkspaceContext =>
  Object.prototype.hasOwnProperty.call(o, "workspace")

const providesSiteAdmin = (o: ContextOptions): o is SiteAdminContext =>
  Object.prototype.hasOwnProperty.call(o, "siteadmin")

const providesWire = (o: ContextOptions): o is WireContext | RecordContext =>
  Object.prototype.hasOwnProperty.call(o, "wire")

const providesFieldMode = (o: ContextOptions): o is FieldModeContext =>
  Object.prototype.hasOwnProperty.call(o, "fieldMode")

//const originalRegex = /\$([.\w]*){(.*?)}/g
//const oneLevelCapture = /\\$([.\w]*){([^{}]*)}/g
//const twoLevelCapture = /\$([.\w]*){((?:[^{}]|{[^{}]*})*)}/g

// We're currently using the two level capture regex. This means that we can capture
// up to two levels of nested merges and it will still just be returned as the
// outermost merge.
const defaultMergeRegex = /\$([.\w]*){((?:[^{}]|{[^{}]*})*)}/g

function injectDynamicContext(
  context: Context,
  additional: ContextOptions | undefined,
) {
  if (!additional) return context

  if (providesWorkspace(additional)) {
    const workspace = additional.workspace
    context = context.setWorkspace({
      name: context.mergeString(workspace.name),
      app: context.mergeString(workspace.app),
    })
  }

  if (providesFieldMode(additional)) {
    const fieldMode = additional.fieldMode
    context = context.addFieldModeFrame(fieldMode)
  }

  if (providesSiteAdmin(additional)) {
    const siteadmin = additional.siteadmin
    context = context.setSiteAdmin({
      name: context.mergeString(siteadmin.name),
      app: context.mergeString(siteadmin.app),
    })
  }

  if (providesWire(additional) && additional.wire) {
    const wire = additional.wire
    context = context.addWireFrame({
      wire,
    })
  }

  return context
}

const getMergeRegexForTypes = (types: MergeType[]) =>
  new RegExp(`\\$(${types.join("|")}){((?:[^{}]|{[^{}]*})*)}`, "g")

const newContext = () => new Context()

const ANCESTOR_INDICATOR = "Parent."

const getViewDef = (viewDefId: string | undefined) =>
  viewDefId
    ? viewSelectors.selectById(getCurrentState(), viewDefId)?.definition
    : undefined
const getWire = (viewId: string | undefined, wireId: string | undefined) =>
  selectWire(getCurrentState(), viewId, wireId)

class Context {
  constructor(stack?: ContextFrame[]) {
    this.stack = stack || []
  }
  clone(stack?: ContextFrame[]) {
    const ctx = new Context(stack ? stack : this.stack)
    ctx.workspace = this.workspace
    ctx.siteadmin = this.siteadmin
    ctx.site = this.site
    ctx.slotLoader = this.slotLoader
    return ctx
  }

  stack: ContextFrame[]
  site?: SiteState
  workspace?: WorkspaceState
  siteadmin?: SiteAdminState
  slotLoader?: MetadataKey

  // returns the context app name, using workspace/site admin context if present
  // or otherwise defaulting to the site context app name
  getApp = () =>
    this.getWorkspace()?.app || this.getSiteAdmin()?.app || this.getSite()?.app

  getRecordId = () => this.getRecord()?.getId()

  removeRecordFrame = (times: number): Context => {
    if (!times) {
      return this
    }
    const index = this.stack.findIndex((frame): frame is RecordContextFrame =>
      providesRecordContext(frame),
    )
    if (index === -1) {
      return this.clone([])
    }
    return this.clone(this.stack.slice(index + 1)).removeRecordFrame(times - 1)
  }

  removeViewFrame = (times: number): Context => {
    if (!times) {
      return this
    }
    const index = this.stack.findIndex((frame): frame is ViewContextFrame =>
      hasViewContext(frame),
    )
    if (index === -1) {
      return this.clone([])
    }
    return this.clone(this.stack.slice(index + 1)).removeViewFrame(times - 1)
  }

  removeViewFrameById = (viewDef: string): Context => {
    // Find the index where we are a view frame with the matching id
    const index = this.stack.findIndex(
      (frame): frame is ViewContextFrame =>
        hasViewContext(frame) && frame.viewDef === viewDef,
    )
    // If we didn't find this view frame don't do anything
    if (index === -1) {
      return this
    }
    return this.clone(this.stack.slice(index + 1))
  }

  removeAllPropsFrames = (): Context =>
    this.clone(
      this.stack.filter(
        (frame): frame is PropsContextFrame => !isPropsContextFrame(frame),
      ),
    )

  removeAllComponentFrames = (type: string): Context =>
    this.clone(
      this.stack.filter(
        (frame): frame is ComponentContextFrame =>
          !(isComponentContextFrame(frame) && frame.componentType === type),
      ),
    )

  getRecordDataIndex = (wireRecord?: WireRecord) =>
    this.stack
      .filter(isRecordDataContextFrame)
      .find(
        (frame) =>
          wireRecord === undefined || frame.recordData === wireRecord.source,
      )?.index

  removeAllThemeFrames = (): Context =>
    this.clone(
      this.stack.filter(
        (frame): frame is ThemeContextFrame => !isThemeContextFrame(frame),
      ),
    )

  // Gets either multiple records or a single record depending on the
  // topmost record-having frame in the context.
  getRecords = (wireId?: string) => {
    const recordFrame = this.stack
      .filter(providesRecordOrMultiRecordContext)
      .find((frame) =>
        wireId
          ? (frame.type === "RECORD" || frame.type === "MULTI_RECORD") &&
            frame.wire === wireId
          : true,
      )

    if (recordFrame?.type === "RECORD_DATA") {
      return [new WireRecord(recordFrame.recordData, "", new Wire())]
    }

    const wire = this.getWire(wireId)

    if (!wire) return undefined

    if (recordFrame?.type === "MULTI_RECORD") {
      return recordFrame.records?.map((record) => wire.getRecord(record)) || []
    }

    // If we've got a recordFrame with a record already, return the associated record
    if (recordFrame?.record) {
      return [wire.getRecord(recordFrame.record)]
    }

    // Otherwise, just return all the data
    return wire.getData()
  }

  getRecord = (wireId?: string, recordId?: string) => {
    if (recordId) {
      const wire = this.getWire(wireId)
      if (!wire) return undefined
      return wire.getRecord(recordId)
    }

    const recordFrame = this.stack
      .filter(providesRecordContext)
      .find((frame) =>
        wireId ? frame.type === "RECORD" && frame.wire === wireId : true,
      )

    if (recordFrame?.type === "RECORD_DATA") {
      return new WireRecord(recordFrame.recordData, "", new Wire())
    }

    const wire = this.getWire(wireId)

    if (!wire) return undefined

    // If we've got a recordFrame with a record already, return the associated record
    if (recordFrame?.record) {
      return wire.getRecord(recordFrame.record)
    }

    // Otherwise, the best we can do is to get the first record in the wire
    return wire.getFirstRecord()
  }

  getViewAndWireId = (
    wireid?: string,
  ): [string | undefined, string | undefined] => {
    const frame = this.stack
      .filter(hasWireContext)
      .find((frame) => (wireid ? frame.wire === wireid : true))
    if (frame) return [frame.view, frame.wire]
    if (wireid) return [this.getViewId(), wireid]
    return [undefined, undefined]
  }

  getViewId = () => {
    const frame = this.stack.find(hasViewContext)
    if (!frame || !frame.view) throw new Error("No View frame found in context")
    return frame.view
  }

  getViewDef = () => getViewDef(this.getViewDefId())

  getParams = () => this.stack.find(isViewContextFrame)?.params

  getParam = (param: string) => this.getParams()?.[param]

  getPropsFrame = () => this.stack.find(isPropsContextFrame)

  getParentComponentDef = (path: string) =>
    get(this.getViewDef(), getAncestorPath(path, 3))

  getTheme = () => {
    const themeFrame = this.stack.find(providesThemeContext)
    if (!themeFrame) return
    const isScoped = !isRouteContextFrame(themeFrame)
    const themeData = themeSelectors.selectById(
      getCurrentState(),
      themeFrame.theme,
    )
    if (!themeData) return
    return {
      ...themeData,
      isScoped,
    }
  }

  getThemeId = () => this.stack.find(providesThemeContext)?.theme

  getCustomSlotLoader = () => this.slotLoader

  getComponentVariant = (componentType: MetadataKey, variant: MetadataKey) => {
    return componentVariantSelectors.selectById(
      getCurrentState(),
      `${componentType}:${variant}`,
    )
  }

  getLabel = (labelKey: string) =>
    labelSelectors.selectById(getCurrentState(), labelKey)?.value

  getStaticFileModstamp = (fileKey: string) =>
    fileSelectors.selectById(getCurrentState(), fileKey)?.updatedAt

  getFeatureFlag = (name: string) =>
    featureFlagSelectors.selectById(getCurrentState(), name)

  getConfigValue = (name: string) =>
    configValueSelectors.selectById(getCurrentState(), name)

  getSelectList = (id: string) =>
    selectListSelectors.selectById(getCurrentState(), id)

  // Collection default to empty string to handle cases where
  // there is no collection for the route assignment (e.g., signup)
  getRouteAssignment = (viewtype: string, collection = "") =>
    routeAssignmentSelectors.selectById(
      getCurrentState(),
      `${viewtype}_${collection}`,
    )

  getRouteAssignments = () =>
    routeAssignmentSelectors.selectAll(getCurrentState())

  getViewDefId = () =>
    this.stack.filter(hasViewContext).find((f) => f?.viewDef)?.viewDef

  getNamespace = () => {
    const viewDefId = this.stack
      .filter(hasViewContext)
      .find((f) => f?.viewDef)?.viewDef
    if (!viewDefId) {
      return undefined
    }
    const [namespace] = parseKey(viewDefId)
    return namespace
  }

  getRoute = () =>
    this.stack.filter(isRouteContextFrame).find((f) => f.route)?.route

  getRouteContext = () => {
    const routeFrame = this.stack.find(isRouteContextFrame)
    return routeFrame ? this.clone([routeFrame]) : newContext()
  }

  getWorkspace = () => this.workspace

  deleteWorkspace = () => {
    const newContext = this.clone()
    delete newContext.workspace
    return newContext
  }
  getSiteAdmin = () => this.siteadmin

  deleteSiteAdmin = () => {
    const newContext = this.clone()
    delete newContext.siteadmin
    return newContext
  }

  deleteCustomSlotLoader = () => {
    const newContext = this.clone()
    delete newContext.slotLoader
    return newContext
  }

  getTenant = () => {
    const workspace = this.getWorkspace()
    return workspace ? workspace : this.getSiteAdmin()
  }

  getTenantType = () => {
    const workspace = this.getWorkspace()
    if (workspace) return "workspace"
    const siteadmin = this.getSiteAdmin()
    if (siteadmin) return "site"
    return undefined
  }

  getSite = () => this.site

  getWireId = () => this.stack.filter(hasWireContext).find(providesWire)?.wire

  getWire = (wireid?: string) => {
    const plainWire = this.getPlainWire(wireid)
    if (!plainWire) return undefined
    const wire = new Wire(plainWire)
    wire.attachCollection(getCollection(plainWire.collection))
    return wire
  }

  getWireCollection = (wireid?: string) => this.getWire(wireid)?.getCollection()

  getPlainWire = (wireid?: string) => {
    const [view, wire] = this.getViewAndWireId(wireid)
    if (!view || !wire) return undefined
    return getWire(view, wire)
  }

  getFieldMode = () =>
    this.stack.find(isFieldModeContextFrame)?.fieldMode || "READ"

  getUser = () => getCurrentState().user

  addWireFrame = (wireContext: WireContext) =>
    this.#addFrame({
      type: WIRE,
      view: wireContext.view || this.getViewId(),
      wire: wireContext.wire,
    })

  addRecordFrame = (recordContext: RecordContext) =>
    this.#addFrame({
      type: RECORD,
      view: recordContext.view || this.getViewId(),
      wire: recordContext.wire,
      record: recordContext.record,
    })

  addMultiRecordFrame = (recordContext: MultiRecordContext) =>
    this.#addFrame({
      type: MULTI_RECORD,
      view: recordContext.view || this.getViewId(),
      wire: recordContext.wire,
      records: recordContext.records,
    })

  addRecordDataFrame = (recordData: PlainWireRecord, index?: number) =>
    this.#addFrame({
      type: RECORD_DATA,
      recordData,
      index,
    })

  addRouteFrame = (routeContext: RouteContext) =>
    this.#addFrame({
      type: ROUTE,
      ...routeContext,
    })

  addThemeFrame = (theme: string) =>
    this.#addFrame({
      type: THEME,
      theme,
    })

  addSignalOutputFrame = (label: string, data: unknown) =>
    this.#addFrame({
      type: SIGNAL_OUTPUT,
      label,
      data,
    })

  setSiteAdmin = (siteadmin: SiteAdminState) => {
    const newContext = this.clone()
    newContext.siteadmin = siteadmin
    return newContext
  }

  setWorkspace = (workspace: WorkspaceState) => {
    const newContext = this.clone()
    newContext.workspace = workspace
    return newContext
  }

  setSite = (site: SiteState) => {
    const newContext = this.clone()
    newContext.site = site
    return newContext
  }

  setCustomSlotLoader = (slot: MetadataKey) => {
    const newContext = this.clone()
    newContext.slotLoader = slot
    return newContext
  }

  addViewFrame = (viewContext: ViewContext) =>
    this.#addFrame({
      type: VIEW,
      ...viewContext,
    })

  addComponentFrame = (componentType: string, data: Record<string, unknown>) =>
    this.#addFrame({
      type: COMPONENT,
      componentType,
      data,
    })

  addPropsFrame = (
    data: BaseDefinition,
    path: string,
    componentType: string,
    slots?: SlotDef[],
  ) =>
    this.#addFrame({
      type: PROPS,
      data,
      path,
      componentType,
      slots,
    })

  // addErrorFrame provides a single-argument method, vs an argument method, since this is the common usage
  addErrorFrame = (errors: string[]) =>
    this.#addFrame({
      type: ERROR,
      errors,
    })

  // addFieldModeFrame provides a single-argument method, vs an argument method, since this is the common usage
  addFieldModeFrame = (fieldMode: FieldMode) =>
    this.#addFrame({
      type: FIELD_MODE,
      fieldMode,
    })

  #addFrame = (frame: ContextFrame) => this.clone([frame].concat(this.stack))

  merge = (template: Mergeable, options?: MergeOptions) => {
    if (typeof template !== "string" || !template.length) {
      return template
    }
    const mergeRegex = options?.types
      ? getMergeRegexForTypes(options.types)
      : defaultMergeRegex
    let expressionReturnValue: FieldValue
    let isSingleMerge = false
    const mergedString = template.replace(
      mergeRegex,
      (match, mergeType, expression, offset) => {
        const mergeSplit = mergeType.split(ANCESTOR_INDICATOR)
        const mergeTypeName = mergeSplit.pop() as MergeType

        const expressionResult = handlers[mergeTypeName || "Record"](
          expression,
          mergeSplit.length ? this.removeRecordFrame(mergeSplit.length) : this,
        )

        if (offset === 0 && match.length === template.length) {
          expressionReturnValue = expressionResult
          isSingleMerge = true
          return ""
        }

        // Don't merge "undefined" into a string --- put empty string instead
        if (expressionResult === undefined || expressionResult === null) {
          return ""
        }

        // Stringify the result
        if (typeof expressionResult === "object") {
          return JSON.stringify(expressionResult)
        }

        return `${expressionResult}`
      },
    )
    // If we only have one expression result, and it is not a string, then return it as its value
    if (isSingleMerge) {
      return expressionReturnValue
    }
    return mergedString
  }

  mergeString = (template: Mergeable, options?: MergeOptions) => {
    const result = this.merge(template, options)
    if (typeof result === "object") {
      return JSON.stringify(result)
    }
    if (typeof result === "function") {
      throw new Error(
        `Merge failed: result is of type ${typeof result} and cannot be returned as a string, please check your merge.`,
      )
    }
    return `${result ?? ""}`
  }

  mergeBoolean = (
    template: Mergeable,
    defaultValue: boolean,
    options?: MergeOptions,
  ) => {
    const result = this.merge(template, options)
    if (typeof result === "boolean") {
      return result
    }
    return defaultValue
  }

  mergeDeep = (value: DeepMergeable, options?: MergeOptions) => {
    if (!value) return value
    if (Array.isArray(value)) {
      return this.mergeList(value, options)
    }
    if (typeof value === "object" && value !== null) {
      return this.mergeMap(value, options)
    }
    return this.merge(value, options)
  }

  mergeList = (
    list: DeepMergeable[] | undefined,
    options?: MergeOptions,
  ): unknown[] | undefined => {
    if (!Array.isArray(list)) return list
    return list.map((item) => this.mergeDeep(item, options))
  }

  mergeMap = <T extends Record<string, unknown> | undefined>(
    map: T,
    options?: MergeOptions,
  ): T =>
    (map
      ? Object.fromEntries(
          Object.entries(map).map((entry) => {
            const [key, value] = entry
            return [key, this.mergeDeep(value as DeepMergeable, options)]
          }),
        )
      : {}) as T

  mergeStringMap = (
    map: Record<string, Mergeable> | undefined,
    options?: MergeOptions,
  ) => this.mergeMap(map, options) as Record<string, string>

  getCurrentErrors = () =>
    this.stack.length && isErrorContextFrame(this.stack[0])
      ? this.stack[0].errors
      : []

  getViewStack = () =>
    this.stack
      .filter(hasViewContext)
      .filter((f) => f?.viewDef)
      .map((contextFrame) => contextFrame.viewDef)

  getSignalOutputs = (label: string) =>
    this.stack.find(
      (f) => isSignalOutputContextFrame(f) && f.label === label,
    ) as SignalOutputContextFrame | undefined

  getSignalOutputData = <T = unknown>(label: string) =>
    this.getSignalOutputs(label)?.data as T | undefined

  getComponentData = (componentType: string) =>
    this.stack.find(
      (f) => isComponentContextFrame(f) && f.componentType === componentType,
    ) as ComponentContextFrame

  getComponentDataValue = <T = unknown>(componentType: string, label: string) =>
    this.getComponentData(componentType)?.data[label] as T | undefined

  getRecordFrame = (wireId: string) =>
    this.stack.find(
      (f) => isRecordContextFrame(f) && f.wire === wireId,
    ) as RecordContextFrame

  hasErrors = () => !!this.getCurrentErrors().length
}

export {
  getWire,
  injectDynamicContext,
  hasViewContext,
  isRecordContextFrame,
  isContextObject,
  newContext,
}

export { Context }

export type {
  ComponentContext,
  ContextFrame,
  ContextOptions,
  ErrorContext,
  FieldMode,
  FieldModeContext,
  Mergeable,
  RecordContext,
  RecordDataContext,
  RouteContext,
  SignalOutputContext,
}
