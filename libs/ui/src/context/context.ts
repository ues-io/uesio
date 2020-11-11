import { Wire } from "../wire/wire"
import { WireRecord } from "../wire/wirerecord"
import { View } from "../view/view"
import RuntimeState from "../store/types/runtimestate"
import WorkspaceState from "../store/types/workspacestate"
import RouteState from "../store/types/routestate"
import { field } from "@uesio/constants"

type ContextFrame = {
	wire?: Wire
	record?: WireRecord
	view?: View
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

	getRecord(): WireRecord | undefined {
		return this.stack.find((frame) => frame?.record)?.record
	}

	getView(): View | undefined {
		return this.stack.find((frame) => frame?.view)?.view
	}

	getRoute(): RouteState | undefined {
		return this.stack.find((frame) => frame?.route)?.route
	}

	getWorkspace(): WorkspaceState | undefined {
		return this.stack.find((frame) => frame?.workspace)?.workspace
	}

	getLatestView(state: RuntimeState): View | undefined {
		const view = this.getView()
		const latestViewState = view && state.view?.[view.getId()]
		return latestViewState && new View(latestViewState)
	}

	getWire(): Wire | undefined {
		return this.stack.find((frame) => frame?.wire)?.wire
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
}

export { Context, ContextFrame }
