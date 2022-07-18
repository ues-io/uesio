import { FunctionComponent, useEffect } from "react"
import { useUesio } from "../../hooks/hooks"
import Slot from "../slot"
import { css } from "@emotion/css"
import { ViewDefinition } from "../../definition/viewdef"
import { getViewDef, useViewDef } from "../../bands/viewdef"
import { getComponentPackKeys } from "../../bands/componentpack"
import loadViewOp from "../../bands/view/operations/load"
import { appDispatch } from "../../store/store"
import { Props } from "./viewdefinition"
const View: FunctionComponent<Props> = (props) => {
	const uesio = useUesio(props)
	const {
		path,
		context,
		definition: { params, view: viewDefId },
	} = props

	const viewId = `${viewDefId}(${path || ""})`
	const cpacks = getComponentPackKeys()

	const subViewClass = css({
		pointerEvents: "none",
		display: "grid",
	})

	const isSubView = !!path

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!context.getBuildMode() && !isSubView
	const scriptResult = uesio.component.usePacks(cpacks, buildMode)
	const viewDef = buildMode ? getViewDef(viewDefId) : useViewDef(viewDefId)
	const useBuildTime = buildMode && scriptResult.loaded
	const viewStack = context.getViewStack()

	const viewContext = context.addFrame({
		view: viewId,
		viewDef: viewDefId,
		buildMode: useBuildTime,
		params: context.mergeMap(params),
	})

	// We need to get load the wires here.
	useEffect(() => {
		appDispatch()(loadViewOp(viewContext))
	}, [viewDefId, JSON.stringify(params)])

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

	if (isSubView && viewStack?.includes(viewDefId)) {
		return (
			<div
				style={{
					color: "rgba(255, 128, 128)",
					padding: "10px 10px 2px",
					border: "1px solid rgba(255, 128, 128)",
					borderLeft: "5px solid rgba(255, 128, 128)",
				}}
			>
				<p
					style={{
						textTransform: "uppercase",
						fontSize: "0.7em",
						fontWeight: "bold",
						margin: 0,
					}}
				>
					uesio/core.view
				</p>
				<pre style={{ whiteSpace: "normal" }}>
					View {viewDefId} cannot be selected in this context, please
					try another one.
				</pre>
			</div>
		)
	}

	if (isSubView && context.getBuildMode()) {
		return <div className={subViewClass}>{slot}</div>
	}

	return <div>{slot}</div>
}

export default View
