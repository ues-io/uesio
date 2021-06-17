import { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import Slot from "./slot"
import { ViewParams } from "../bands/view/types"
import { useViewDef } from "../bands/viewdef/selectors"
import { css } from "@emotion/css"

interface Props extends BaseProps {
	definition: {
		view: string
		params?: ViewParams
	}
}

const View: FunctionComponent<Props> = (props) => {
	const uesio = useUesio(props)
	const {
		path,
		context,
		definition: { params, view: viewDefId },
	} = props

	const viewId = `${viewDefId}(${path})`
	const viewDef = useViewDef(viewDefId)

	const subViewClass = css({
		pointerEvents: "none",
		display: "grid",
	})

	const isSubView = !!path

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!context.getBuildMode() && !isSubView
	const scriptResult = uesio.component.usePacks(
		Object.keys(viewDef?.dependencies?.componentpacks || {}),
		buildMode
	)

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

	const slot = (
		<Slot
			definition={viewDef.definition}
			listName="components"
			path=""
			accepts={["uesio.standalone"]}
			context={viewContext}
		/>
	)

	return isSubView && context.getBuildMode() ? (
		<div className={subViewClass}>{slot}</div>
	) : (
		slot
	)
}

export default View
