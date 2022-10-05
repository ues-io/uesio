import { getCurrentState, SiteState } from "../store/store"
import Collection from "../bands/collection/class"
import { RouteState, TenantState } from "../bands/route/types"
import { selectors as collectionSelectors } from "../bands/collection/adapter"
import { selectors as viewSelectors } from "../bands/viewdef"
import { selectors as labelSelectors } from "../bands/label"
import { selectors as componentVariantSelectors } from "../bands/componentvariant"
import { selectors as themeSelectors } from "../bands/theme"
import { selectByName } from "../bands/featureflag"
import { selectWire } from "../bands/wire"
import Wire from "../bands/wire/class"
import { defaultTheme } from "../styles/styles"
import { getURLFromFullName, getUserFileURL } from "../hooks/fileapi"
import get from "lodash/get"
import { getAncestorPath } from "../component/path"
import { PlainWireRecord } from "../bands/wirerecord/types"
import WireRecord from "../bands/wirerecord/class"
import { ID_FIELD } from "../collectionexports"
import { getErrorString } from "../bands/utils"

type FieldMode = "READ" | "EDIT"

type MergeType =
	| "Record"
	| "Param"
	| "User"
	| "Time"
	| "RecordId"
	| "Theme"
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
	workspace?: TenantState
	siteadmin?: TenantState
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
	errorMessage,
	viewDefId,
}: {
	mergeType: MergeType
	expression: string
	errorMessage: string
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
		if (errorMessage === "noValue") return noValue

		return {
			mergeType,
			expression,
			viewDefId,
		}
	}

	return console.log(title, { ...getErrorFeedback(), viewDefId, expression })
}

const newContext = (initialFrame: ContextFrame) => new Context([initialFrame])

const handlers: Record<MergeType, MergeHandler> = {
	Record: (expression, context, ancestors) => {
		context = context.removeRecordFrame(ancestors)
		const value = context.getRecord()?.getFieldValue(expression)
		return value !== undefined && value !== null ? `${value}` : ""
	},
	Param: (expression, context) => context.getParam(expression) || "",
	User: (expression, context) => {
		const user = context.getUser()
		if (!user) return ""
		if (expression === "initials") {
			return user.firstname
				? user.firstname.charAt(0) + user.lastname.charAt(0)
				: user.id.charAt(0)
		}
		if (expression === "picture") {
			// Remove the workspace context here
			return getUserFileURL(new Context(), user.picture)
		}
		if (expression === "id") return user.id
		if (expression === "username") return user.username
		return ""
	},
	Time: (expression, context) => {
		const value = context.getRecord()?.getFieldValue(expression)
		if (!value) return ""
		const date = new Date(value as number)
		return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
	},
	RecordId: (expression, context, ancestors) => {
		context = context.removeRecordFrame(ancestors)
		return context.getRecordId() || ""
	},
	Theme: (expression, context) => {
		const [scope, value] = expression.split(".")
		const theme = context.getTheme()
		if (scope === "color") {
			return theme.definition.palette[value]
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
			const errorMessage = getErrorString(error)

			handleMergeError({
				mergeType,
				expression,
				errorMessage,
				viewDefId: context.getViewDefId() || "",
			})
			return ""
		}
	})

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

	stack: ContextFrame[]

	getRecordId = () => this.getRecord()?.getId()

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
		themeSelectors.selectById(getCurrentState(), this.getThemeId() || "") ||
		defaultTheme

	getThemeId = () => this.stack.find((frame) => frame?.theme)?.theme

	getComponentVariant = (componentType: string, variantName: string) =>
		componentVariantSelectors.selectById(
			getCurrentState(),
			`${componentType}:${variantName}`
		)

	getLabel = (labelKey: string) =>
		labelSelectors.selectById(getCurrentState(), labelKey)?.value

	getFeatureFlag = (name: string) => selectByName(getCurrentState(), name)

	getViewDefId = () => this.stack.find((frame) => frame?.viewDef)?.viewDef

	getRoute = () => this.stack.find((frame) => frame?.route)?.route

	getWorkspace = () => this.stack.find((frame) => frame?.workspace)?.workspace

	getSiteAdmin = () => this.stack.find((frame) => frame?.siteadmin)?.siteadmin

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

	getUser = () => getCurrentState().user

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

	getCurrentErrors = () => this.stack[0].errors || []

	getViewStack = () =>
		this.stack
			.map((contextFrame) => contextFrame?.viewDef)
			.filter((def) => def)
}

export {
	Context,
	ContextFrame,
	FieldMode,
	RouteState,
	SiteState,
	TenantState,
	getWire,
	newContext,
}
