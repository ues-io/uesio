import { getStore, SiteState } from "../store/store"
import Collection from "../bands/collection/class"
import { RouteState, WorkspaceState } from "../bands/route/types"
import { selectors as collectionSelectors } from "../bands/collection/adapter"
import { selectors as viewSelectors } from "../bands/viewdef"
import { selectors as labelSelectors } from "../bands/label"
import { selectors as componentVariantSelectors } from "../bands/componentvariant"
import { selectors as themeSelectors } from "../bands/theme"
import { selectWire } from "../bands/wire/selectors"
import Wire from "../bands/wire/class"
import { defaultTheme } from "../styles/styles"
import chroma from "chroma-js"
import { getURLFromFullName, getUserFileURL } from "../hooks/fileapi"
import { ThemeState } from "../definition/theme"
import get from "lodash/get"
import { getAncestorPath } from "../component/path"
import { PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { ID_FIELD } from "../collectionexports"
import { ViewDefinition } from "../definition/viewdef"
import { ComponentVariant } from "../definition/componentvariant"

type FieldMode = "READ" | "EDIT"

type SiteAdminState = {
	name: string
	app: string
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
	params?: Record<string, string>
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
}) => {
	const title = "Error in Template merge"
	const getErrorFeedback = () => {
		const missingMergeType = {
			msg: "mergeType is undefined",
		}
		const invalidMergeType = {
			msg: `${mergeType} is not a valid mergeType.`,
			validMergeTypes: Object.keys(handlers),
		}
		const noValue = {
			msg: "No value found",
			mergeType,
		}
		if (!mergeType) return missingMergeType
		if (!(mergeType in handlers)) return invalidMergeType
		if (error.message === "noValue") return noValue

		return {
			mergeType,
			expression,
			viewDefId,
		}
	}

	return console.log(title, { ...getErrorFeedback(), viewDefId, expression })
}

const handlers: Record<MergeType, MergeHandler> = {
	Record: (expression, context, ancestors) => {
		context = context.removeRecordFrame(ancestors)
		const value = context.getRecord()?.getFieldValue(expression)
		return value ? `${value}` : ""
	},
	Param: (expression, context) => context.getParam(expression) || "",
	User: (expression, context) => {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname
				? user.firstname.charAt(0) + user.lastname.charAt(0)
				: user.id.charAt(0)
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
		if (!label) return expression
		return label || "missing label value"
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
		? (viewSelectors.selectById(getStore().getState(), viewDefId)
				?.parsed as ViewDefinition)
		: undefined

const getWire = (viewId: string | undefined, wireId: string | undefined) =>
	selectWire(getStore().getState(), viewId, wireId)

class Context {
	constructor(stack?: ContextFrame[]) {
		this.stack = stack || []
	}

	stack: ContextFrame[]

	getRecordId = () => this.stack.find((frame) => frame?.record)?.record

	getRecordData = () =>
		this.stack.find((frame) => frame?.recordData)?.recordData

	removeRecordFrame = (times: number): Context => {
		if (!times) {
			return this
		}
		const index = this.stack.findIndex(
			(frame) => frame?.record || frame?.wire
		)
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
			return undefined
		}
		if (recordFrame.recordData) {
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

	getViewId = () => this.stack.find((frame) => frame?.view)?.view

	getViewDef = () => getViewDef(this.getViewDefId())

	getParams = () => this.stack.find((frame) => frame?.params)?.params

	getParam = (param: string) => this.getParams()?.[param]

	getParentComponentDef = (path: string) =>
		get(this.getViewDef(), getAncestorPath(path, 3))

	getTheme = () =>
		(themeSelectors.selectById(
			getStore().getState(),
			this.getThemeId() || ""
		)?.parsed || defaultTheme) as ThemeState

	getThemeId = () => this.stack.find((frame) => frame?.theme)?.theme

	getComponentVariant = (componentType: string, variantName: string) =>
		componentVariantSelectors.selectById(
			getStore().getState(),
			`${componentType}:${variantName}`
		)?.parsed as ComponentVariant

	getLabel = (labelKey: string) =>
		labelSelectors.selectById(getStore().getState(), labelKey)?.content

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
		const index = this.stack.findIndex(
			(frame) => frame?.recordData || frame?.record || frame?.wire
		)
		if (index === undefined) return undefined
		return this.stack[index]
	}

	getWire = () => {
		const state = getStore().getState()
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

	getPlainWire = () => {
		const wireFrame = this.findWireFrame()
		const wireId = wireFrame?.getWireId()
		if (!wireId) return undefined
		return getWire(wireFrame?.getViewId(), wireId)
	}

	getFieldMode = () =>
		this.stack.find((frame) => frame?.fieldMode)?.fieldMode || "READ"

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

	mergeMap = (
		map: Record<string, string> | undefined
	): Record<string, string> =>
		map
			? Object.fromEntries(
					Object.entries(map).map((entries) => [
						entries[0],
						this.merge(entries[1]),
					])
			  )
			: {}

	getErrors = () => this.stack.find((frame) => frame?.errors)?.errors
}

export {
	Context,
	ContextFrame,
	FieldMode,
	RouteState,
	WorkspaceState,
	SiteState,
	getWire,
}
