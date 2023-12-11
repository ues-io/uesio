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
import { selectors as themeSelectors } from "../bands/theme"
import { selectByName } from "../bands/featureflag"
import { selectWire } from "../bands/wire"
import Wire from "../bands/wire/class"
import { defaultTheme } from "../styles/styles"
import get from "lodash/get"
import { getAncestorPath } from "../component/path"
import { FieldValue, PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { parseVariantName } from "../component/component"
import { MetadataKey } from "../metadata/types"
import { SiteState } from "../bands/site"
import { handlers, MergeType } from "./merge"
import { getCollection } from "../bands/collection/selectors"

const ERROR = "ERROR",
	COMPONENT = "COMPONENT",
	RECORD = "RECORD",
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
	data: object
	errors?: string[]
	label: string
}

interface ComponentContext {
	componentType: string
	data: Record<string, unknown>
}

interface PropsContext {
	data: Record<string, unknown>
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
	| RecordDataContextFrame
	| WireContextFrame
	| ErrorContextFrame
	| FieldModeContextFrame
	| SignalOutputContextFrame
	| PropsContextFrame

// Type Guards for fully-resolved Context FRAMES (with "type" property appended)
const isErrorContextFrame = (frame: ContextFrame): frame is ErrorContextFrame =>
	frame.type === "ERROR"

const isThemeContextFrame = (
	frame: ContextFrame
): frame is ThemeContextFrame | RouteContextFrame =>
	[THEME, ROUTE].includes(frame.type)

const isRecordContextFrame = (
	frame: ContextFrame
): frame is RecordContextFrame => frame.type === RECORD

const isComponentContextFrame = (
	frame: ContextFrame
): frame is ComponentContextFrame => frame.type === COMPONENT

const isSignalOutputContextFrame = (
	frame: ContextFrame
): frame is SignalOutputContextFrame => frame.type === SIGNAL_OUTPUT

const providesRecordContext = (
	frame: ContextFrame
): frame is RecordContextFrame | RecordDataContextFrame =>
	[RECORD, RECORD_DATA].includes(frame.type)

const isFieldModeContextFrame = (
	frame: ContextFrame
): frame is FieldModeContextFrame => frame.type === FIELD_MODE
const isRecordDataContextFrame = (
	frame: ContextFrame
): frame is RecordDataContextFrame => frame.type === RECORD_DATA
const isViewContextFrame = (frame: ContextFrame): frame is ViewContextFrame =>
	frame.type === VIEW
const isRouteContextFrame = (frame: ContextFrame): frame is RouteContextFrame =>
	frame.type === ROUTE
const isPropsContextFrame = (frame: ContextFrame): frame is PropsContextFrame =>
	frame.type === PROPS
const hasWireContext = (
	frame: ContextFrame
): frame is RecordContextFrame | WireContextFrame =>
	[RECORD, WIRE].includes(frame.type)
const hasViewContext = (
	frame: ContextFrame
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

function injectDynamicContext(
	context: Context,
	additional: ContextOptions | undefined
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
		this.stack = stack || ([] as ContextFrame[])
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

	getRecordId = () => this.getRecord()?.getId()

	removeRecordFrame = (times: number): Context => {
		if (!times) {
			return this
		}
		const index = this.stack.findIndex(
			(frame): frame is RecordContextFrame => providesRecordContext(frame)
		)
		if (index === -1) {
			return this.clone([])
		}
		return this.clone(this.stack.slice(index + 1)).removeRecordFrame(
			times - 1
		)
	}

	getRecordDataIndex = (wireRecord?: WireRecord) =>
		this.stack
			.filter(isRecordDataContextFrame)
			.find(
				(frame) =>
					wireRecord === undefined ||
					frame.recordData === wireRecord.source
			)?.index

	getRecord = (wireId?: string) => {
		const recordFrame = this.stack
			.filter(providesRecordContext)
			.find((frame) =>
				wireId ? frame.type === "RECORD" && frame.wire === wireId : true
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
		wireid?: string
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
		if (!frame || !frame.view) throw "No View frame found in context"
		return frame.view
	}

	getViewDef = () => getViewDef(this.getViewDefId())

	getParams = () => this.stack.find(isViewContextFrame)?.params

	getParam = (param: string) => this.getParams()?.[param]

	getProp = (prop: string) => this.stack.find(isPropsContextFrame)?.data[prop]

	getParentComponentDef = (path: string) =>
		get(this.getViewDef(), getAncestorPath(path, 3))

	getTheme = () =>
		themeSelectors.selectById(getCurrentState(), this.getThemeId() || "") ||
		defaultTheme

	getThemeId = () => this.stack.find(isThemeContextFrame)?.theme

	getCustomSlotLoader = () => this.slotLoader

	getComponentVariant = (
		componentType: MetadataKey,
		variantName: MetadataKey
	) => {
		const [component, variant] = parseVariantName(
			variantName,
			componentType
		)
		return componentVariantSelectors.selectById(
			getCurrentState(),
			`${component}:${variant}`
		)
	}

	getLabel = (labelKey: string) =>
		labelSelectors.selectById(getCurrentState(), labelKey)?.value

	getStaticFileModstamp = (fileKey: string) =>
		fileSelectors.selectById(getCurrentState(), fileKey)?.updatedAt

	getFeatureFlag = (name: string) => selectByName(getCurrentState(), name)

	getViewDefId = () =>
		this.stack.filter(hasViewContext).find((f) => f?.viewDef)?.viewDef

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

	getWireCollection = (wireid?: string) =>
		this.getWire(wireid)?.getCollection()

	getPlainWire = (wireid?: string) => {
		const [view, wire] = this.getViewAndWireId(wireid)
		if (!view || !wire) return undefined
		return getWire(view, wire)
	}

	getFieldMode = () =>
		this.stack.find(isFieldModeContextFrame)?.fieldMode || "READ"

	getUser = () => getCurrentState().user
	getSession = () => getCurrentState().session

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

	addSignalOutputFrame = (label: string, data: object) =>
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

	addComponentFrame = (
		componentType: string,
		data: Record<string, unknown>
	) =>
		this.#addFrame({
			type: COMPONENT,
			componentType,
			data,
		})

	addPropsFrame = (data: Record<string, unknown>) =>
		this.#addFrame({
			type: PROPS,
			data,
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

	merge = (template: Mergeable) => {
		if (typeof template !== "string" || !template.length) {
			return template
		}

		const expressionResults = [] as FieldValue[]
		const mergedString = template.replace(
			/\$([.\w]*){(.*?)}/g,
			(x, mergeType, expression) => {
				const mergeSplit = mergeType.split(ANCESTOR_INDICATOR)
				const mergeTypeName = mergeSplit.pop() as MergeType

				const expressionResult = handlers[mergeTypeName || "Record"](
					expression,
					mergeSplit.length
						? this.removeRecordFrame(mergeSplit.length)
						: this
				)
				expressionResults.push(expressionResult)

				// Don't merge "undefined" into a string --- put empty string instead
				if (
					expressionResult === undefined ||
					expressionResult === null
				) {
					return ""
				}
				return `${expressionResult}`
			}
		)
		// If we only have one expression result, and it is not a string, then return it as its value
		if (
			expressionResults.length === 1 &&
			typeof expressionResults[0] !== "string"
		) {
			return expressionResults[0]
		}
		return mergedString
	}

	mergeString = (template: Mergeable) => {
		const result = this.merge(template)
		if (typeof result === "object") {
			return JSON.stringify(result)
		}
		if (typeof result === "function") {
			throw new Error(
				`Merge failed: result is of type ${typeof result} and cannot be returned as a string, please check your merge.`
			)
		}
		return `${result ?? ""}`
	}

	mergeBoolean = (template: Mergeable, defaultValue: boolean) => {
		const result = this.merge(template)
		if (typeof result === "boolean") {
			return result
		}
		return defaultValue
	}

	mergeDeep = (value: DeepMergeable) => {
		if (!value) return value
		if (Array.isArray(value)) {
			return this.mergeList(value)
		}
		if (typeof value === "object" && value !== null) {
			return this.mergeMap(value)
		}
		return this.merge(value)
	}

	mergeList = (list: DeepMergeable[] | undefined): unknown[] | undefined => {
		if (!Array.isArray(list)) return list
		return list.map((item) => this.mergeDeep(item))
	}

	mergeMap = <T extends Record<string, unknown> | undefined>(map: T): T =>
		(map
			? Object.fromEntries(
					Object.entries(map).map((entry) => {
						const [key, value] = entry
						return [key, this.mergeDeep(value as DeepMergeable)]
					})
			  )
			: {}) as T

	mergeStringMap = (map: Record<string, Mergeable> | undefined) =>
		this.mergeMap(map) as Record<string, string>

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
			(f) => isSignalOutputContextFrame(f) && f.label === label
		) as SignalOutputContextFrame

	getComponentData = (componentType: string) =>
		this.stack.find(
			(f) =>
				isComponentContextFrame(f) && f.componentType === componentType
		) as ComponentContextFrame

	getRecordFrame = (wireId: string) =>
		this.stack.find(
			(f) => isRecordContextFrame(f) && f.wire === wireId
		) as RecordContextFrame
}

export {
	getWire,
	injectDynamicContext,
	hasViewContext,
	isRecordContextFrame,
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
	ViewContext,
}
