import { getStore, SiteState } from "../store/store"
import Collection from "../bands/collection/class"
import { RouteState, WorkspaceState } from "../bands/route/types"
import { selectors as viewDefSelectors } from "../bands/viewdef/adapter"
import { selectors as themeSelectors } from "../bands/theme/adapter"
import { selectWire } from "../bands/wire/selectors"
import { selectors } from "../bands/view/adapter"
import Wire from "../bands/wire/class"
import { defaultTheme } from "../styles/styles"
import chroma from "chroma-js"
import { getURLFromFullName } from "../hooks/fileapi"
import { PlainWire } from "../bands/wire/types"

type FieldMode = "READ" | "EDIT"

type ContextFrame = {
	wire?: string
	record?: string
	view?: string
	viewDef?: string
	buildMode?: boolean
	fieldMode?: FieldMode
	noMerge?: boolean
	route?: RouteState
	workspace?: WorkspaceState
	siteadmin?: SiteState
	site?: SiteState
	theme?: string
	mediaOffset?: number
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
	} else if (mergeTypeName === "User") {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname.charAt(0) + user.lastname.charAt(0)
		} else if (expression === "picture") {
			return user.picture
		}
	} else if (mergeTypeName === "RecordId") {
		context = context.removeRecordFrame(mergeAncestors)
		return context.getRecord()?.getId() || ""
	} else if (mergeTypeName === "Theme") {
		const [scope, value, op] = expression.split(".")
		const theme = context.getTheme()
		if (scope === "color") {
			if (op === "darken") {
				return chroma(theme.definition.palette[value]).darken(0.5).hex()
			}
			return theme.definition.palette[value]
		}
		return ""
	} else if (mergeTypeName === "Color") {
		const [color, op] = expression.split(".")
		if (chroma.valid(color)) {
			if (op === "darken") {
				return chroma(color).darken(0.5).hex()
			}
		}
		return ""
	} else if (mergeTypeName === "File") {
		return `url("${getURLFromFullName(context, expression)}")`
	}
	return ""
}

const inject = (template: string, context: Context): string =>
	template.replace(/\$([.\w]*){(.*?)}/g, (x, mergeType, mergeExpression) =>
		getFromContext(mergeType, mergeExpression, context)
	)

const getViewDef = (viewDefId: string | undefined) =>
	viewDefId
		? viewDefSelectors.selectById(getStore().getState(), viewDefId)
		: undefined

const getWire = (viewId: string | undefined, wireId: string | undefined) =>
	selectWire(getStore().getState(), viewId, wireId)

const getWireDef = (wire: PlainWire | undefined) => {
	if (!wire) return undefined
	const viewDefId = wire.view.split("(")[0]
	const viewDef = getViewDef(viewDefId)
	return viewDef?.definition?.wires?.[wire.name]
}

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
		const recordFrame = this.findRecordFrame()

		// if we don't have a record id in context return the first
		if (!recordFrame) {
			const wire = this.getWire()
			if (!wire) {
				return undefined
			}
			const size = wire.getSize()
			if (!size) {
				throw new Error(
					"No record provided for context and zero records exist"
				)
			}
			if (size > 1) {
				throw new Error(
					"No record provided for context and multiple records exist"
				)
			}
			return wire?.getFirstRecord()
		}

		const recordId = recordFrame.getRecordId()

		const wire = recordFrame.getWire()

		return recordId ? wire?.getRecord(recordId) : undefined
	}

	getViewId = () => this.stack.find((frame) => frame?.view)?.view

	getView = () => {
		const viewId = this.getViewId()
		return viewId
			? selectors.selectById(getStore().getState(), viewId)
			: undefined
	}

	getViewDef = () => getViewDef(this.getViewDefId())

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

	getRoute = () => this.stack.find((frame) => frame?.route)?.route

	getWorkspace = () => this.stack.find((frame) => frame?.workspace)?.workspace

	getSiteAdmin = () => this.stack.find((frame) => frame?.siteadmin)?.siteadmin

	getSite = () => this.stack.find((frame) => frame?.site)?.site

	getWireId = () => this.stack.find((frame) => frame?.wire)?.wire

	getMediaOffset = () =>
		this.stack.find((frame) => frame?.mediaOffset)?.mediaOffset

	findWireFrame = () => {
		const index = this.stack.findIndex((frame) => frame?.wire)
		if (index < 0) {
			return undefined
		}
		return new Context(this.stack.slice(index))
	}

	findRecordFrame = () => {
		const index = this.stack.findIndex((frame) => frame?.record)
		if (index < 0) {
			return undefined
		}
		return new Context(this.stack.slice(index))
	}

	getWire = () => {
		const state = getStore().getState()
		const plainWire = this.getPlainWire()
		const wireDef = getWireDef(plainWire)
		if (!wireDef) return undefined
		const wire = new Wire(plainWire)
		const collection = new Collection(
			state?.collection?.[wireDef.collection] || null
		)
		wire.attachCollection(collection.source)
		return wire
	}

	getPlainWire = () => {
		const wireFrame = this.findWireFrame()
		const wireId = wireFrame?.getWireId()
		if (!wireId) return undefined
		return getWire(wireFrame?.getViewId(), wireId)
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

	getUser = () => getStore().getState().user

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

export {
	Context,
	ContextFrame,
	FieldMode,
	RouteState,
	WorkspaceState,
	SiteState,
	getWireDef,
	getWire,
}
