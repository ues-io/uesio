import { field } from "@uesio/constants"
import { getStore } from "../store/store"
import { ViewBand } from "../view/viewband"
import Collection from "../bands/collection/class"
import { RouteState, WorkspaceState } from "../bands/route/types"
import { selectors as viewDefSelectors } from "../bands/viewdef"
import { selectWire } from "../bands/wire/selectors"
import { Wire } from "../wire/wire"

type ContextFrame = {
	wire?: string
	record?: string
	view?: string
	buildMode?: boolean
	fieldMode?: field.FieldMode
	noMerge?: boolean
	route?: RouteState
	workspace?: WorkspaceState
}

const getFromContext = (
	mergeType: string,
	mergeExpression: string,
	context: Context
): string => {
	const record = context.getRecord()
	const view = context.getView()
	if ((mergeType === "" || mergeType === "Record") && record) {
		const value = record.getFieldValue(mergeExpression)
		return value ? `${value}` : ""
	} else if (mergeType === "Param" && view) {
		const value = view.getParam(mergeExpression)
		return value ? `${value}` : ""
	}
	return ""
}

const inject = (template: string, context: Context): string =>
	template.replace(/\$([\w]*){(.*?)}/g, (x, mergeType, mergeExpression) =>
		getFromContext(mergeType, mergeExpression, context)
	)

class Context {
	constructor(stack?: ContextFrame[]) {
		this.stack = stack || []
	}

	stack: ContextFrame[]

	getRecordId = () => this.stack.find((frame) => frame?.record)?.record

	getRecord = () => {
		const recordId = this.getRecordId()
		const wire = this.getWire()
		return recordId ? wire?.getRecord(recordId) : undefined
	}

	getViewId = () => this.stack.find((frame) => frame?.view)?.view

	getView = () => {
		const viewId = this.getViewId()
		const view = ViewBand.getActor(getStore().getState(), viewId)
		return view.valid ? view : undefined
	}

	getViewDef = () => {
		const viewDefId = this.getView()?.getViewDefId()
		return viewDefId
			? viewDefSelectors.selectById(getStore().getState(), viewDefId)
			: undefined
	}

	getWireDef = (wirename: string) =>
		this.getViewDef()?.definition?.wires[wirename]

	getRoute = () => this.stack.find((frame) => frame?.route)?.route

	getWorkspace = () => this.stack.find((frame) => frame?.workspace)?.workspace

	getWireId = () => this.stack.find((frame) => frame?.wire)?.wire

	getWire = () => {
		const state = getStore().getState()
		const wireId = this.getWireId()
		const viewId = this.getViewId()
		if (!wireId) return undefined
		const plainWire = selectWire(state, wireId, viewId)
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
					Object.entries(map).map((entries) => {
						return [entries[0], this.merge(entries[1])]
					})
			  )
			: map
}

export { Context, ContextFrame }
