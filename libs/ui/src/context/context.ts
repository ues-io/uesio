import { Wire } from "../wire/wire"
import { WireRecord } from "../wire/wirerecord"
import { View } from "../view/view"
import { field } from "@uesio/constants"
import { getStore } from "../store/store"
import { ViewBand } from "../view/viewband"
import { WireBand } from "../wire/wireband"
import Collection from "../bands/collection/class"
import { RouteState, WorkspaceState } from "../bands/route/types"

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

type StringMap = {
	[key: string]: string
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
		return value ? value + "" : ""
	} else if (mergeType === "Param" && view) {
		const value = view.getParam(mergeExpression)
		return value ? value + "" : ""
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

	getRecordId(): string | undefined {
		return this.stack.find((frame) => frame?.record)?.record
	}

	getRecord(): WireRecord | undefined {
		const recordId = this.getRecordId()
		const wire = this.getWire()
		return recordId ? wire?.getRecord(recordId) : undefined
	}

	getViewId(): string | undefined {
		return this.stack.find((frame) => frame?.view)?.view
	}

	getView(): View | undefined {
		const store = getStore()
		const state = store.getState()
		const viewId = this.getViewId()
		const view = ViewBand.getActor(state, viewId)
		return view.valid ? view : undefined
	}

	getRoute(): RouteState | undefined {
		return this.stack.find((frame) => frame?.route)?.route
	}

	getWorkspace(): WorkspaceState | undefined {
		return this.stack.find((frame) => frame?.workspace)?.workspace
	}

	getWireId(): string | undefined {
		return this.stack.find((frame) => frame?.wire)?.wire
	}

	getWire(): Wire | undefined {
		const store = getStore()
		const state = store.getState()
		const wireId = this.getWireId()
		const viewId = this.getViewId()
		const wire = WireBand.getActor(state, wireId, viewId)
		const collection = new Collection(
			state?.collection?.[wire.getCollectionName()] || null
		)
		wire.attachCollection(collection.source)
		return wire.valid ? wire : undefined
	}

	getFieldMode(): field.FieldMode {
		return (
			this.stack.find((frame) => frame?.fieldMode === "EDIT")
				?.fieldMode || "READ"
		)
	}

	getBuildMode(): boolean {
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

	getNoMerge(): boolean {
		return this.stack.some((frame) => frame?.noMerge)
	}

	addFrame(frame: ContextFrame): Context {
		return new Context([frame].concat(this.stack))
	}

	merge(template: string | undefined): string {
		// If we are in a no-merge context, just return the template
		if (this.getNoMerge()) {
			return template || ""
		}
		return template ? inject(template, this) : ""
	}

	mergeMap(map?: StringMap): StringMap | undefined {
		if (!map) {
			return map
		}
		return Object.fromEntries(
			Object.entries(map).map((entries) => {
				return [entries[0], this.merge(entries[1])]
			})
		)
	}
}

export { Context, ContextFrame }
