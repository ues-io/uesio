import { FunctionComponent, useEffect } from "react"
import { useUesio } from "../../hooks/hooks"
import Slot from "../slot"
import { css } from "@emotion/css"
import { ViewDefinition } from "../../definition/viewdef"
import { useViewDef } from "../../bands/viewdef"
import { getComponentPackKeys } from "../../bands/componentpack"
import loadViewOp from "../../bands/view/operations/load"
import { appDispatch } from "../../store/store"
import { ViewProps } from "./viewdefinition"
import { ComponentInternal } from "../../component/component"
import PanelArea from "./../panelarea"
const View: FunctionComponent<ViewProps> = (props) => {
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
	const viewDef = useViewDef(viewDefId)
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

	if (isSubView && viewStack?.includes(viewDefId)) {
		throw new Error(
			`View {viewDefId} cannot be selected in this context, please try another one.`
		)
	}

	const slot = (
		<Slot
			definition={viewDef.parsed as ViewDefinition}
			listName="components"
			path=""
			accepts={["uesio.standalone"]}
			context={viewContext}
		/>
	)

	if (isSubView && context.getBuildMode()) {
		return <div className={subViewClass}>{slot}</div>
	}

	if (!isSubView && context.getBuildMode()) {
		return (
			<ComponentInternal
				context={viewContext}
				componentType="uesio/studio.runtime"
				path=""
			>
				{slot}
			</ComponentInternal>
		)
	}

	if (!isSubView) {
		return (
			<>
				{slot}
				<div
					style={{
						position: "fixed",
						width: "100%",
						height: "100%",
						top: 0,
						left: 0,
						pointerEvents: "none",
					}}
				>
					<PanelArea context={props.context} />
				</div>
			</>
		)
	}

	return slot
}

export default View
