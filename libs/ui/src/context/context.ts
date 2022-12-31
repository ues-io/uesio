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

const newContext = (initialFrame: ContextFrame) => new Context([initialFrame])

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

export { Context, ContextFrame, FieldMode, RouteState, getWire, newContext }
