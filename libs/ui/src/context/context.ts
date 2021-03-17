import { field } from "@uesio/constants"
import { getStore, SiteState } from "../store/store"
import Collection from "../bands/collection/class"
import { RouteState, WorkspaceState } from "../bands/route/types"
import { selectors as viewDefSelectors } from "../bands/viewdef/adapter"
import { selectors as themeSelectors } from "../bands/theme/adapter"
import { selectWire } from "../bands/wire/selectors"
import { selectors } from "../bands/view/adapter"
import Wire from "../bands/wire/class"
import { defaultTheme } from "../styles/styles"

type ContextFrame = {
	wire?: string
	record?: string
	view?: string
	viewDef?: string
	buildMode?: boolean
	fieldMode?: field.FieldMode
	noMerge?: boolean
	route?: RouteState
	workspace?: WorkspaceState
	siteadmin?: SiteState
	site?: SiteState
	theme?: string
}

const ANCESTOR_INDICATOR = "Parent."

const getFromContext = (
	mergeType: string,
	expression: string,
	context: Context
) => {
	const mergeSplit = mergeType.split(ANCESTOR_INDICATOR)
	const mergeTypeName = mergeSplit.pop()
	const mergeAncestors = mergeSplit.length

	if (mergeTypeName === "" || mergeTypeName === "Record") {
		context = context.removeRecordFrame(mergeAncestors)
		const value = context.getRecord()?.getFieldValue(expression)
		return value ? `${value}` : ""
	} else if (mergeTypeName === "Param") {
		return context.getView()?.params?.[expression] || ""
	} else if (mergeTypeName === "RecordId") {
		context = context.removeRecordFrame(mergeAncestors)
		return context.getRecord()?.getId() || ""
	}
	return ""
}

const inject = (template: string, context: Context): string =>
	template.replace(/\$([.\w]*){(.*?)}/g, (x, mergeType, mergeExpression) =>
		getFromContext(mergeType, mergeExpression, context)
	)

class Context {
	constructor(stack?: ContextFrame[]) {
		this.stack = stack || []
	}

	stack: ContextFrame[]

	getRecordId = () => this.stack.find((frame) => frame?.record)?.record

	removeRecordFrame = (times: number): Context => {
		if (!times) {
			return this
		}
		const index = this.stack.findIndex((frame) => frame?.record)
		if (index === -1) {
			return new Context()
		}
		return new Context(this.stack.slice(index + 1)).removeRecordFrame(
			times - 1
		)
	}

	getRecord = () => {
		const recordId = this.getRecordId()
		const wire = this.getWire()
		return recordId ? wire?.getRecord(recordId) : undefined
	}

	getViewId = () => this.stack.find((frame) => frame?.view)?.view

	getView = () => {
		const viewId = this.getViewId()
		return viewId
			? selectors.selectById(getStore().getState(), viewId)
			: undefined
	}

	getViewDef = () => {
		const viewDefId = this.getViewDefId()
		return viewDefId
			? viewDefSelectors.selectById(getStore().getState(), viewDefId)
			: undefined
	}
	getTheme = () =>
		themeSelectors.selectById(
			getStore().getState(),
			this.getThemeId() || ""
		) || defaultTheme

	getThemeId = () => this.stack.find((frame) => frame?.theme)?.theme

	getComponentVariant = (componentType: string, variantName: string) =>
		this.getViewDef()?.dependencies?.componentvariants?.[
			componentType + "." + variantName
		]

	getViewDefId = () => this.stack.find((frame) => frame?.viewDef)?.viewDef

	getWireDef = (wirename: string) =>
		this.getViewDef()?.definition?.wires?.[wirename]

	getRoute = () => this.stack.find((frame) => frame?.route)?.route

	getWorkspace = () => this.stack.find((frame) => frame?.workspace)?.workspace

	getSiteAdmin = () => this.stack.find((frame) => frame?.siteadmin)?.siteadmin

	getSite = () => this.stack.find((frame) => frame?.site)?.site

	getWireId = () => this.stack.find((frame) => frame?.wire)?.wire

	getWire = () => {
		const state = getStore().getState()
		const wireId = this.getWireId()
		if (!wireId) return undefined
		const plainWire = selectWire(state, this.getViewId(), wireId)
		const wireDef = this.getWireDef(wireId)
		if (!wireDef) return undefined
		const wire = new Wire(plainWire)
		const collection = new Collection(
			state?.collection?.[wireDef.collection] || null
		)
		wire.attachCollection(collection.source)
		return wire
	}

	getFieldMode = () =>
		this.stack.find((frame) => frame?.fieldMode === "EDIT")?.fieldMode ||
		"READ"

	getBuildMode = () => {
		for (const frame of this.stack) {
			if (frame.buildMode) {
				return true
			}
			if (frame.buildMode === false) {
				return false
			}
		}
		return false
	}

	getNoMerge = () => this.stack.some((frame) => frame?.noMerge)

	addFrame = (frame: ContextFrame) => new Context([frame].concat(this.stack))

	merge = (template: string | undefined) => {
		// If we are in a no-merge context, just return the template
		if (this.getNoMerge()) {
			return template || ""
		}
		return template ? inject(template, this) : ""
	}

	mergeMap = (map?: Record<string, string>) =>
		map
			? Object.fromEntries(
					Object.entries(map).map((entries) => [
						entries[0],
						this.merge(entries[1]),
					])
			  )
			: map
}

export { Context, ContextFrame, RouteState, WorkspaceState, SiteState }
