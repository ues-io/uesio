import { getStore, SiteState } from "../store/store"
import Collection from "../bands/collection/class"
import { RouteState, WorkspaceState } from "../bands/route/types"
import { selectors as viewDefSelectors } from "../bands/viewdef/adapter"
import { selectors as themeSelectors } from "../bands/theme/adapter"
import { selectors as collectionSelectors } from "../bands/collection/adapter"
import { selectById as selectVariant } from "../bands/componentvariant/adapter"
import { selectById as selectLabel } from "../bands/label/adapter"
import { selectWire } from "../bands/wire/selectors"
import { selectors } from "../bands/view/adapter"
import Wire from "../bands/wire/class"
import { defaultTheme } from "../styles/styles"
import chroma from "chroma-js"
import { getURLFromFullName, getUserFileURL } from "../hooks/fileapi"
import { PlainWire } from "../bands/wire/types"
import get from "lodash/get"
import { getAncestorPath } from "../component/path"
import { PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { ID_FIELD } from "../collectionexports"

type FieldMode = "READ" | "EDIT"

type SiteAdminState = {
	name: string
	app: string
	version?: string
}

type MergeType =
	| "Record"
	| "Param"
	| "User"
	| "RecordId"
	| "Theme"
	| "Color"
	| "File"
	| "UserFile"
	| "Site"
	| "Label"
	| "SelectList"

type ContextFrame = {
	wire?: string
	record?: string
	recordData?: PlainWireRecord // A way to store arbitrary record data in context
	view?: string
	viewDef?: string
	buildMode?: boolean
	fieldMode?: FieldMode
	noMerge?: boolean
	route?: RouteState
	workspace?: WorkspaceState
	siteadmin?: SiteAdminState
	site?: SiteState
	theme?: string
	mediaOffset?: number
	errors?: string[]
}

type MergeHandler = (
	expression: string,
	context: Context,
	ancestors: number
) => string

const handleMergeError = ({
	mergeType,
	expression,
	error,
	viewDefId,
}: {
	mergeType: MergeType
	expression: string
	error: Error
	viewDefId: string
}) =>
	// const title = "Error in Template merge"
	// const getErrorFeedback = () => {
	// 	const missingMergeType = {
	// 		msg: "mergeType is undefined",
	// 	}
	// 	const invalidMergeType = {
	// 		msg: `${mergeType} is not a valid mergeType.`,
	// 		validMergeTypes: Object.keys(handlers),
	// 	}
	// 	const noValue = {
	// 		msg: "No value found",
	// 		mergeType,
	// 	}
	// 	if (!mergeType) return missingMergeType
	// 	if (!(mergeType in handlers)) return invalidMergeType
	// 	if (error.message === "noValue") return noValue

	// 	return {
	// 		mergeType,
	// 		expression,
	// 		viewDefId,
	// 	}
	// }

	// return console.log(title, { ...getErrorFeedback(), viewDefId, expression })
	null

const handlers: Record<MergeType, MergeHandler> = {
	Record: (expression, context, ancestors) => {
		context = context.removeRecordFrame(ancestors)

		const value = context.getRecord()?.getFieldValue(expression)
		return value ? `${value}` : ""
	},
	Param: (expression, context) =>
		context.getView()?.params?.[expression] || "",
	User: (expression, context) => {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname.charAt(0) + user.lastname.charAt(0)
		} else if (expression === "picture") {
			// Remove the workspace context here
			return getUserFileURL(new Context(), user.picture)
		}
		return ""
	},
	RecordId: (expression, context, ancestors) => {
		context = context.removeRecordFrame(ancestors)
		return context.getRecord()?.getId() || ""
	},
	Theme: (expression, context) => {
		const [scope, value, op] = expression.split(".")
		const theme = context.getTheme()
		if (scope === "color") {
			if (op === "darken") {
				return chroma(theme.definition.palette[value]).darken(0.5).hex()
			}
			return theme.definition.palette[value]
		}
		return ""
	},
	Color: (expression) => {
		const [color, op] = expression.split(".")
		if (chroma.valid(color)) {
			if (op === "darken") {
				return chroma(color).darken(0.5).hex()
			}
		}
		return ""
	},
	SelectList: (expression, context) => {
		const wire = context.getWire()
		const fieldMetadata = wire?.getCollection().getField(expression)
		const selectListMetadata = fieldMetadata?.getSelectOptions()
		const value = context.getRecord()?.getFieldValue(expression)
		return selectListMetadata?.find((el) => el.value === value)?.label || ""
	},
	File: (expression, context) => getURLFromFullName(context, expression),
	UserFile: (expression, context) => {
		const file = context
			.getRecord()
			?.getFieldValue<PlainWireRecord>(expression)
		if (!file) return ""
		const fileId = file[ID_FIELD] as string
		if (!fileId) return ""
		return getUserFileURL(context, fileId)
	},
	Site: (expression, context) => {
		const site = context.getSite()
		if (!site) return ""
		if (expression === "domain") {
			return site.domain
		}
		return ""
	},
	Label: (expression, context) => {
		const label = context.getLabel(expression)
		if (!label) return "Label not found" // We might want to do some more error related stuff here
		return label.value || "missing label value"
	},
}

const ANCESTOR_INDICATOR = "Parent."

const inject = (template: string, context: Context): string =>
	template.replace(/\$([.\w]*){(.*?)}/g, (x, mergeType, expression) => {
		const mergeSplit = mergeType.split(ANCESTOR_INDICATOR)
		const mergeTypeName = mergeSplit.pop() as MergeType
		const mergeAncestors = mergeSplit.length

		try {
			const value = handlers[mergeTypeName || "Record"](
				expression,
				context,
				mergeAncestors
			)
			if (!value) throw new Error("noValue")
			return value
		} catch (error) {
			handleMergeError({
				mergeType,
				expression,
				error,
				viewDefId: context.getViewDefId() || "",
			})
			return ""
		}
	})

const getViewDef = (viewDefId: string | undefined) =>
	viewDefId
		? viewDefSelectors.selectById(getStore().getState(), viewDefId)
		: undefined

const getWire = (viewId: string | undefined, wireId: string | undefined) =>
	selectWire(getStore().getState(), viewId, wireId)

const getWireDef = (wire: PlainWire | undefined) =>
	wire ? getWireDefFromWireName(wire.view, wire.name) : undefined

const getWireDefFromWireName = (viewId: string, wirename: string) => {
	const viewDefId = viewId.split("(")[0]
	const viewDef = getViewDef(viewDefId)
	return viewDef?.definition?.wires?.[wirename]
}

class Context {
	constructor(stack?: ContextFrame[]) {
		this.stack = stack || []
	}

	stack: ContextFrame[]

	getWireById = (id: string) => getWire(this.getViewDefId() + "()", id)

	getRecordId = () => this.stack.find((frame) => frame?.record)?.record

	getRecordData = () =>
		this.stack.find((frame) => frame?.recordData)?.recordData

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

		const recordData = recordFrame.getRecordData()
		if (recordData) {
			return new WireRecord(recordData, "", new Wire())
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

	getParentComponentDef = (path: string) =>
		get(this.getViewDef()?.definition, getAncestorPath(path, 3))

	getTheme = () =>
		themeSelectors.selectById(
			getStore().getState(),
			this.getThemeId() || ""
		) || defaultTheme

	getThemeId = () => this.stack.find((frame) => frame?.theme)?.theme

	getComponentVariant = (componentType: string, variantName: string) =>
		selectVariant(getStore().getState(), `${componentType}.${variantName}`)

	getLabel = (labelKey: string) =>
		selectLabel(getStore().getState(), labelKey)

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
		const recordDataIndex = this.stack.findIndex(
			(frame) => frame?.recordData
		)
		if (recordDataIndex >= 0) {
			return new Context(this.stack.slice(recordDataIndex))
		}

		const index = this.stack.findIndex((frame) => frame?.record)
		if (index < 0) {
			return undefined
		}
		return new Context(this.stack.slice(index))
	}

	getWire = (id?: string) => {
		const state = getStore().getState()
		const ctx = id
			? this.addFrame({
					wire: id,
			  })
			: this
		const plainWire = ctx.getPlainWire()
		const wireDef = getWireDef(plainWire)
		if (!wireDef) return undefined
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
	getErrors = () => this.stack.find((frame) => frame?.errors)?.errors
}

export {
	Context,
	ContextFrame,
	FieldMode,
	RouteState,
	WorkspaceState,
	SiteState,
	getWireDef,
	getWireDefFromWireName,
	getWire,
}
