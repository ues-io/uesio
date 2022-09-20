import { FunctionComponent, useEffect } from "react"
import Slot from "../slot"
import { css } from "@emotion/css"
import { useViewDef } from "../../bands/viewdef"
import loadViewOp from "../../bands/view/operations/load"
import { appDispatch } from "../../store/store"
import { ViewProps } from "./viewdefinition"
import { ComponentInternal } from "../../component/component"
import PanelArea from "./../panelarea"
import { makeViewId } from "../../bands/view"
import { useUesio } from "../../hooks/hooks"
const View: FunctionComponent<ViewProps> = (props) => {
	const {
		path,
		context,
		definition: { params, view: viewDefId },
	} = props

	const uesio = useUesio(props)
	const componentId = path ? uesio.component.getId() : ""
	const viewId = makeViewId(viewDefId, componentId)

	const subViewClass = css({
		pointerEvents: "none",
		display: "grid",
	})

	const isSubView = !!path

	const viewDef = useViewDef(viewDefId)

	const viewContext = context.addFrame({
		view: viewId,
		viewDef: viewDefId,
		params: context.mergeMap(params),
	})

	useEffect(() => {
		appDispatch()(loadViewOp(viewContext))
	}, [viewDefId, JSON.stringify(params)])

	if (!viewDef) return null

	if (isSubView && context.getViewStack()?.includes(viewDefId)) {
		throw new Error(
			`View {viewDefId} cannot be selected in this context, please try another one.`
		)
	}

	const slot = (
		<Slot
			definition={viewDef}
			listName="components"
			path=""
			accepts={["uesio.standalone"]}
			context={viewContext.addFrame({
				buildMode: !!context.getBuildMode() && !isSubView,
			})}
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
