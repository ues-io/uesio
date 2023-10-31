import { FunctionComponent, MouseEvent } from "react"
import { definition, styles, api } from "@uesio/ui"
import {
	useBuilderState,
	useDragPath,
	useDropPath,
	setSelectedPath,
} from "../../api/stateapi"
import { FullPath } from "../../api/path"
import SelectBorder from "./selectborder"
import {
	getDragLeaveHandler,
	getDragOverHandler,
	getDropHandler,
} from "../../helpers/dragdrop"

const Canvas: FunctionComponent<definition.UtilityProps> = (props) => {
	const context = props.context

	const [dimensions] = useBuilderState<[number, number]>(
		context,
		"dimensions"
	)

	const width = dimensions && dimensions[0]
	const height = dimensions && dimensions[1]

	const classes = styles.useUtilityStyleTokens(
		{
			root: ["overflow-hidden", "h-full", "relative"],

			scrollwrapper: ["overflow-auto", "h-full", "w-full"],

			outerwrapper: [
				"relative",
				"overflow-auto",
				"bg-white",
				`w-[${width ? width + "px" : "100%"}]`,
				`h-[${height ? height + "px" : "100%"}]`,
				"mx-auto",
				"transition-all",
				"border",
				"border-slate-300",
				"rounded-md",
			],
			contentwrapper: [
				"overflow-auto",
				"h-full",
				"[container-type:inline-size]",
			],
		},
		props
	)

	const dragPath = useDragPath(context)
	const dropPath = useDropPath(context)

	const viewDefId = context.getViewDefId()
	const viewDef = api.view.useViewDef(viewDefId)
	const route = context.getRoute()

	if (!route || !viewDefId || !viewDef) return null

	const onClick = (e: MouseEvent) => {
		// Step 1: Find the closest slot that is accepting the current dragpath.
		let target = e.target as Element | null

		let validPath = ""
		while (target !== null && target !== e.currentTarget) {
			const index = target.getAttribute("data-index") || ""
			target = target.parentElement
			if (!target) break
			const path = target.getAttribute("data-path") || ""
			if (index && path) {
				validPath = `${path}["${index}"]`
				break
			}
		}

		if (validPath) {
			setSelectedPath(
				context,
				new FullPath("viewdef", viewDefId, validPath)
			)
		}
	}

	return (
		<div
			onDragLeave={getDragLeaveHandler(context)}
			onDragOver={getDragOverHandler(context, dragPath, dropPath)}
			onDrop={getDropHandler(context, dragPath, dropPath)}
			onClick={onClick}
			className={classes.root}
		>
			<div className={classes.scrollwrapper}>
				<div className={classes.outerwrapper}>
					<div id="innercanvas" className={classes.contentwrapper}>
						{props.children}
						<SelectBorder viewdef={viewDef} context={context} />
					</div>
				</div>
			</div>
		</div>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
