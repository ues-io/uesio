import { FunctionComponent, RefObject, useRef } from "react"
import { BaseProps } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import Slot from "./slot"
import { ViewParams } from "../bands/view/types"
import { css } from "@emotion/css"
import { ViewDefinition } from "../definition/viewdef"
import { useViewDef } from "../bands/viewdef"
import { useComponentPackKeys } from "../bands/componentpack"

interface Props extends BaseProps {
	definition: {
		view: string
		params?: ViewParams
	}
}
let panelsDomNode: RefObject<HTMLDivElement> | undefined = undefined

const View: FunctionComponent<Props> = (props) => {
	const uesio = useUesio(props)
	const {
		path,
		context,
		definition: { params, view: viewDefId },
	} = props
	const newPanelsNode = useRef<HTMLDivElement>(null)

	const viewId = `${viewDefId}(${path || ""})`
	const viewDef = useViewDef(viewDefId)
	const cpacks = useComponentPackKeys()

	const subViewClass = css({
		pointerEvents: "none",
		display: "grid",
	})

	const isSubView = !!path

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!context.getBuildMode() && !isSubView
	const scriptResult = uesio.component.usePacks(cpacks, buildMode)

	const useBuildTime = buildMode && scriptResult.loaded

	const viewContext = context.addFrame({
		view: viewId,
		viewDef: viewDefId,
		buildMode: useBuildTime,
	})

	const view = uesio.view.useView(
		viewId,
		context.mergeMap(params),
		viewContext
	)

	if (!viewDef || !view || !view.loaded || !scriptResult.loaded) return null

	const content = viewDef.parsed as ViewDefinition

	const slot = (
		<Slot
			definition={content}
			listName="components"
			path=""
			accepts={["uesio.standalone"]}
			context={viewContext}
		/>
	)

	if (isSubView) {
		if (context.getBuildMode()) {
			return <div className={subViewClass}>{slot}</div>
		}
		return <div>{slot}</div>
	}
	panelsDomNode = newPanelsNode
	return (
		<div>
			{slot}
			<div ref={newPanelsNode} />
		</div>
	)
}

export default View
export { panelsDomNode }
