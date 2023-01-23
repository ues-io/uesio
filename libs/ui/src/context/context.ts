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
import { parseVariantName } from "../component/component"
import { MetadataKey } from "../bands/builder/types"

type FieldMode = "READ" | "EDIT"

type Mergeable = string | number | boolean | undefined

type MergeType =
	| "Record"
	| "Param"
	| "User"
	| "Time"
	| "Date"
	| "RecordId"
	| "Theme"
	| "File"
	| "UserFile"
	| "Site"
	| "Label"
	| "SelectList"
	| "Sum"

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

type MergeHandler = (expression: string, context: Context) => string

const newContext = (initialFrame: ContextFrame) => new Context([initialFrame])

const handlers: Record<MergeType, MergeHandler> = {
	Record: (fullExpression, context) => {
		const expressionParts = fullExpression.split(":")
		let record: WireRecord | undefined
		let expression = fullExpression
		if (expressionParts.length === 1) {
			record = context.getRecord()
		} else {
			const wirename = expressionParts[0]
			const wire = context.getWireByName(wirename)
			record = wire?.getFirstRecord()
			expression = expressionParts[1]
		}
		const value = record?.getFieldValue(expression)
		return value !== undefined && value !== null ? `${value}` : ""
	},
	Sum: (fullExpression, context) => {
		const expressionParts = fullExpression.split(":")
		let wire: Wire | undefined
		let expression = fullExpression
		if (expressionParts.length === 1) {
			wire = context.getWire()
		} else {
			const wirename = expressionParts[0]
			wire = context.getWireByName(wirename)
			expression = expressionParts[1]
		}

		let total = 0
		wire?.getData().forEach((record) => {
			total += (record.getFieldValue(expression) as number) || 0
		})
		return "" + total
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
			return getUserFileURL(
				context.getWorkspace() ? new Context() : context,
				user.picture
			)
		}
		return user[expression as keyof typeof user] || ""
	},
	Time: (expression, context) => {
		const value = context.getRecord()?.getFieldValue(expression)
		if (!value) return ""
		const date =
			typeof value === "string"
				? new Date(parseInt(value, 10))
				: new Date(value as number)
		return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
	},
	Date: (expression, context) => {
		const value = context.getRecord()?.getFieldValue(expression)
		if (!value) return ""
		const date =
			typeof value === "string"
				? new Date(parseInt(value, 10))
				: new Date(value as number)

		return date.toLocaleDateString(undefined, { timeZone: "UTC" })
	},
	RecordId: (expression, context) => context.getRecordId() || "",
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

	getRecordId = (wireId?: string) => this.getRecord(wireId)?.getId()

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

	getRecord = (wireId?: string) => {
		const recordFrame = this.findRecordFrame(wireId)

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

	findRecordFrame = (wireId?: string) =>
		this.stack.find((frame) => {
			if (wireId)
				return (
					frame.wire === wireId &&
					(frame?.recordData || frame?.record)
				)
			return frame?.recordData || frame?.record || frame.wire
		})

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
		const wireFrame = this.findWireFrame()
		const wireId = wireFrame?.getWireId()
		if (!wireId) return undefined
		return getWire(wireFrame?.getViewId(), wireId)
	}

	getPlainWireByName = (wirename: string) => {
		if (!wirename) return undefined
		return getWire(this.getViewId(), wirename)
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

	merge = (template: Mergeable) => {
		// If we are in a no-merge context, just return the template
		if (this.getNoMerge()) {
			return template || ""
		}

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
