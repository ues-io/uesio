import { getCurrentState } from "../store/store"
import Collection from "../bands/collection/class"
import {
	RouteState,
	SiteAdminState,
	WorkspaceState,
} from "../bands/route/types"
import { selectors as collectionSelectors } from "../bands/collection/adapter"
import { selectors as viewSelectors } from "../bands/viewdef"
import { selectors as labelSelectors } from "../bands/label"
import { selectors as componentVariantSelectors } from "../bands/componentvariant"
import { selectors as themeSelectors } from "../bands/theme"
import { selectByName } from "../bands/featureflag"
import { selectWire } from "../bands/wire"
import Wire from "../bands/wire/class"
import { defaultTheme } from "../styles/styles"
import get from "lodash/get"
import { getAncestorPath } from "../component/path"
import { PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { parseVariantName } from "../component/component"
import { MetadataKey } from "../bands/builder/types"
import { SiteState } from "../bands/site"
import { handlers, MergeType } from "./merge"

type FieldMode = "READ" | "EDIT"

type Mergeable = string | number | boolean | undefined

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
}

interface ViewContext extends ParamsContext {
	view: string
	viewDef: string
}

interface RouteContext extends ParamsContext {
	route: RouteState
	site: SiteState
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

interface ParamsContext {
	params?: Record<string, string>
}

interface ThemeContextFrame extends ThemeContext {
	type: "THEME"
}

interface SiteAdminContextFrame extends SiteAdminContext {
	type: "SITE_ADMIN"
}

interface WorkspaceContextFrame extends WorkspaceContext {
	type: "WORKSPACE"
}

interface RouteContextFrame extends RouteContext {
	type: "ROUTE"
}

interface ViewContextFrame extends ViewContext {
	type: "VIEW"
}

interface RecordContextFrame extends RecordContext {
	type: "RECORD"
	// We will throw an error if view is not available at time of construction
	view: string
}

interface RecordDataContextFrame extends RecordDataContext {
	type: "RECORD_DATA"
}

interface WireContextFrame extends WireContext {
	type: "WIRE"
	// We will throw an error if view is not available at time of construction
	view: string
}

interface ParamsContextFrame extends ParamsContext {
	type: "PARAMS"
}

interface ErrorContextFrame extends ErrorContext {
	type: "ERROR"
}

interface FieldModeContextFrame extends FieldModeContext {
	type: "FIELD_MODE"
}

type ContextOptions =
	| RouteContext
	| SiteAdminContext
	| WorkspaceContext
	| ThemeContext
	| ViewContext
	| RecordContext
	| RecordDataContext
	| WireContext
	| ParamsContext
	| ErrorContext
	| FieldModeContext

type ContextFrame =
	| RouteContextFrame
	| SiteAdminContextFrame
	| WorkspaceContextFrame
	| ThemeContextFrame
	| ViewContextFrame
	| RecordContextFrame
	| RecordDataContextFrame
	| WireContextFrame
	| ParamsContextFrame
	| ErrorContextFrame
	| FieldModeContextFrame

// Type Guards for fully-resolved Context FRAMES (with "type" property appended)
const isErrorContextFrame = (frame: ContextFrame): frame is ErrorContextFrame =>
	frame.type === "ERROR"

const isSiteAdminContextFrame = (
	frame: ContextFrame
): frame is SiteAdminContextFrame => frame.type === "SITE_ADMIN"

const isWorkspaceContextFrame = (
	frame: ContextFrame
): frame is WorkspaceContextFrame => frame.type === "WORKSPACE"

const isThemeContextFrame = (
	frame: ContextFrame
): frame is ThemeContextFrame | RouteContextFrame =>
	["THEME", "ROUTE"].includes(frame.type)

const isRecordContextFrame = (
	frame: ContextFrame
): frame is RecordContextFrame | RecordDataContextFrame =>
	["RECORD", "RECORD_DATA"].includes(frame.type)

const isFieldModeContextFrame = (
	frame: ContextFrame
): frame is FieldModeContextFrame => frame.type === "FIELD_MODE"
const hasParamsContext = (
	frame: ContextFrame
): frame is ParamsContextFrame | ViewContextFrame | RouteContextFrame =>
	["PARAMS", "VIEW", "ROUTE"].includes(frame.type)
const isRouteContextFrame = (frame: ContextFrame): frame is RouteContextFrame =>
	frame.type === "ROUTE"
const hasWireContext = (
	frame: ContextFrame
): frame is RecordContextFrame | WireContextFrame =>
	["RECORD", "WIRE"].includes(frame.type)
const hasViewContext = (
	frame: ContextFrame
): frame is ViewContextFrame | RouteContextFrame =>
	["VIEW", "ROUTE"].includes(frame.type)

// Type Guards for pre-resolved Context objects (no type property yet)
const providesWorkspace = (o: ContextOptions): o is WorkspaceContext =>
	Object.prototype.hasOwnProperty.call(o, "workspace")

const providesView = (o: ContextOptions): o is RouteContext | ViewContext =>
	Object.prototype.hasOwnProperty.call(o, "view")

const providesSiteAdmin = (o: ContextOptions): o is SiteAdminContext =>
	Object.prototype.hasOwnProperty.call(o, "siteadmin")

const providesWire = (o: ContextOptions): o is WireContext | RecordContext =>
	Object.prototype.hasOwnProperty.call(o, "wire")

const providesWireAndView = (
	o: ContextOptions
): o is WireContext | RecordContext =>
	Object.prototype.hasOwnProperty.call(o, "wire") &&
	Object.prototype.hasOwnProperty.call(o, "view")

const providesFieldMode = (o: ContextOptions): o is FieldModeContext =>
	Object.prototype.hasOwnProperty.call(o, "fieldMode")

const providesParams = (
	o: ContextOptions
): o is RouteContext | ParamsContext | ViewContext =>
	Object.prototype.hasOwnProperty.call(o, "params")

function injectDynamicContext(context: Context, additional: unknown) {
	if (!additional) return context

	if (providesWorkspace(additional)) {
		const workspace = additional.workspace
		context = context.addWorkspaceFrame({
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
		context = context.addSiteAdminFrame({
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

	if (additional === "REMOVE_PREV_CTX") {
		context = context.removeRecordFrame(1)
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

	stack: ContextFrame[]

	getRecordId = () => this.getRecord()?.getId()

	removeRecordFrame = (times: number): Context => {
		if (!times) {
			return this
		}
		const index = this.stack.findIndex(
			(frame): frame is RecordContextFrame => isRecordContextFrame(frame)
		)
		if (index === -1) {
			return new Context()
		}
		return new Context(this.stack.slice(index + 1)).removeRecordFrame(
			times - 1
		)
	}

	getRecord = () => {
		const recordFrame = this.stack.find(isRecordContextFrame)

		// if we don't have a record id in context return the first
		if (undefined === recordFrame) {
			return undefined
		}
		if (recordFrame.type === "RECORD_DATA") {
			return new WireRecord(recordFrame.recordData, "", new Wire())
		}

		const wire = this.getWire()
		if (!wire) {
			return undefined
		}

		if (recordFrame.record) {
			return wire.getRecord(recordFrame.record)
		}

		return undefined
	}

	// Find the first WireFrame or RecordFrame which provides a wire and a view
	getWireProviderFrame = () =>
		this.stack.filter(hasWireContext).find(providesWireAndView)

	getViewId = () => {
		const frame = this.stack.filter(hasViewContext).find(providesView)
		if (!frame || !frame.view) throw "No View frame found in context"
		return frame.view
	}

	getViewDef = () => getViewDef(this.getViewDefId())

	getParams = () =>
		this.stack.filter(hasParamsContext).find(providesParams)?.params

	getParam = (param: string) => this.getParams()?.[param]

	getParentComponentDef = (path: string) =>
		get(this.getViewDef(), getAncestorPath(path, 3))

	getTheme = () =>
		themeSelectors.selectById(getCurrentState(), this.getThemeId() || "") ||
		defaultTheme

	getThemeId = () => this.stack.find(isThemeContextFrame)?.theme

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

	getFeatureFlag = (name: string) => selectByName(getCurrentState(), name)

	getViewDefId = () =>
		this.stack.filter(hasViewContext).find((f) => f?.viewDef)?.viewDef

	getRoute = () =>
		this.stack.filter(isRouteContextFrame).find((f) => f.route)?.route

	getRouteContext = () => {
		const routeFrame = this.stack.find(isRouteContextFrame)
		return routeFrame ? new Context([routeFrame]) : newContext()
	}

	getWorkspace = () => this.stack.find(isWorkspaceContextFrame)?.workspace

	getSiteAdmin = () => this.stack.find(isSiteAdminContextFrame)?.siteadmin

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

	getSite = () =>
		this.stack.filter(isRouteContextFrame).find((f) => f.site)?.site

	getWireId = () => this.stack.filter(hasWireContext).find(providesWire)?.wire

	getWire = () => {
		const state = getCurrentState()
		const plainWire = this.getPlainWire()
		const wire = new Wire(plainWire)
		const plainCollection = collectionSelectors.selectById(
			state,
			plainWire?.collection || ""
		)
		if (!plainCollection) return undefined
		const collection = new Collection(plainCollection)
		wire.attachCollection(collection.source)
		return wire
	}

	getWireByName = (wirename: string) => {
		const state = getCurrentState()
		const plainWire = this.getPlainWireByName(wirename)
		const wire = new Wire(plainWire)
		const plainCollection = collectionSelectors.selectById(
			state,
			plainWire?.collection || ""
		)
		if (!plainCollection) return undefined
		const collection = new Collection(plainCollection)
		wire.attachCollection(collection.source)
		return wire
	}

	getPlainWire = () => {
		const wireProviderFrame = this.getWireProviderFrame()
		if (wireProviderFrame === undefined) return undefined
		return getWire(wireProviderFrame.view, wireProviderFrame.wire)
	}

	getPlainWireByName = (wirename: string) => {
		if (!wirename) return undefined
		return getWire(this.getViewId(), wirename)
	}

	getFieldMode = () =>
		this.stack.find(isFieldModeContextFrame)?.fieldMode || "READ"

	getUser = () => getCurrentState().user

	addWireFrame = (wireContext: WireContext) =>
		this.#addFrame({
			type: "WIRE",
			view: wireContext.view || this.getViewId(),
			wire: wireContext.wire,
		})

	addRecordFrame = (recordContext: RecordContext) =>
		this.#addFrame({
			type: "RECORD",
			view: recordContext.view || this.getViewId(),
			wire: recordContext.wire,
			record: recordContext.record,
		})

	// addRecordDataFrame provides a single-argument method, vs an argument method, since this is the common usage
	addRecordDataFrame = (recordData: PlainWireRecord) =>
		this.#addFrame({
			type: "RECORD_DATA",
			recordData,
		})

	addRouteFrame = (routeContext: RouteContext) =>
		this.#addFrame({
			type: "ROUTE",
			...routeContext,
		})

	addSiteAdminFrame = (siteadmin: SiteAdminState) =>
		this.#addFrame({
			type: "SITE_ADMIN",
			siteadmin,
		})

	addWorkspaceFrame = (workspace: WorkspaceState) =>
		this.#addFrame({
			type: "WORKSPACE",
			workspace,
		})

	addThemeFrame = (theme: string) =>
		this.#addFrame({
			type: "THEME",
			theme,
		})

	addViewFrame = (viewContext: ViewContext) =>
		this.#addFrame({
			type: "VIEW",
			...viewContext,
		})

	// addErrorFrame provides a single-argument method, vs an argument method, since this is the common usage
	addErrorFrame = (errors: string[]) =>
		this.#addFrame({
			type: "ERROR",
			errors,
		})

	// addParamsFrame provides a single-argument method, vs an argument method, since this is the common usage
	addParamsFrame = (params: Record<string, string>) =>
		this.#addFrame({
			type: "PARAMS",
			params,
		})

	// addFieldModeFrame provides a single-argument method, vs an argument method, since this is the common usage
	addFieldModeFrame = (fieldMode: FieldMode) =>
		this.#addFrame({
			type: "FIELD_MODE",
			fieldMode,
		})

	#addFrame = (frame: ContextFrame) => new Context([frame].concat(this.stack))

	merge = (template: Mergeable) => {
		if (typeof template !== "string") {
			return template
		}

		return template.replace(
			/\$([.\w]*){(.*?)}/g,
			(x, mergeType, expression) => {
				const mergeSplit = mergeType.split(ANCESTOR_INDICATOR)
				const mergeTypeName = mergeSplit.pop() as MergeType

				return handlers[mergeTypeName || "Record"](
					expression,
					mergeSplit.length
						? this.removeRecordFrame(mergeSplit.length)
						: this
				)
			}
		)
	}

	mergeString = (template: Mergeable) => {
		const result = this.merge(template)
		if (!result) return ""
		if (typeof result !== "string") {
			throw new Error(
				`Merge failed: result is not a string it's a ${typeof result} instead: ${result}`
			)
		}
		return result
	}

	mergeMap = (
		map: Record<string, Mergeable> | undefined
	): Record<string, Mergeable> =>
		map
			? Object.fromEntries(
					Object.entries(map).map((entries) => [
						entries[0],
						this.merge(entries[1]),
					])
			  )
			: {}

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
}

export {
	Context,
	ContextFrame,
	FieldMode,
	newContext,
	injectDynamicContext,
	getWire,
}
