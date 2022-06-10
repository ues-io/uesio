import { FunctionComponent, useEffect } from "react"
import { BaseProps } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import Slot from "./slot"
import { css } from "@emotion/css"
import { ViewDefinition } from "../definition/viewdef"
import { useViewDef } from "../bands/viewdef"
import { getComponentPackKeys } from "../bands/componentpack"
import loadViewOp from "../bands/view/operations/load"
import { appDispatch } from "../store/store"

interface Props extends BaseProps {
	definition: {
		view: string
		params?: Record<string, string>
	}
}

const View: FunctionComponent<Props> = (props) => {
	const uesio = useUesio(props)
	const {
		path,
		context,
		definition: { params, view: viewDefId },
	} = props

	const viewId = `${viewDefId}(${path || ""})`
	const viewDef = useViewDef(viewDefId)
	const cpacks = getComponentPackKeys()

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
		params: context.mergeMap(params),
	})

	// We need to get load the wires here.
	useEffect(() => {
		appDispatch()(loadViewOp(viewContext))
	}, [JSON.stringify(params)])

	if (!viewDef || !scriptResult.loaded) return null

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

	if (isSubView && context.getBuildMode()) {
		return <div className={subViewClass}>{slot}</div>
	}

	return <div>{slot}</div>
}

export default View
