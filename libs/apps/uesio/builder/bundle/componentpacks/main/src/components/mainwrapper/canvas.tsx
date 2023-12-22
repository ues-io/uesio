import { DragEvent, FunctionComponent, MouseEvent, useRef } from "react"
import { definition, styles, api } from "@uesio/ui"
import {
	useBuilderState,
	useDragPath,
	useDropPath,
	setSelectedPath,
	getSelectedComponentPath,
	setDropPath,
} from "../../api/stateapi"
import { FullPath } from "../../api/path"
import SelectBorder from "./selectborder"
import { getDragOverHandler, getDropHandler } from "../../helpers/dragdrop"
import { get } from "../../api/defapi"

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
				"border-slate-500",
				"rounded-md",
			],
			contentwrapper: [
				"overflow-auto",
				"h-full",
				"[container-type:inline-size]",
				"pointer-events-none",
			],
		},
		props
	)

	const dragPath = useDragPath(context)
	const dropPath = useDropPath(context)

	const viewDefId = context.getViewDefId()
	const viewDef = api.view.useViewDef(viewDefId)
	const route = context.getRoute()

	const contentRef = useRef<HTMLDivElement>(null)

	if (!route || !viewDefId || !viewDef) return null

	const onClick = (e: MouseEvent) => {
		// Step 1: Find the closest slot that is accepting the current dragpath.
		contentRef.current?.classList.remove("pointer-events-none")
		let target = document.elementFromPoint(e.clientX, e.clientY)
		contentRef.current?.classList.add("pointer-events-none")
		if (!target) return
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
			const pathToSelect = new FullPath("viewdef", viewDefId, validPath)
			const def = get(context, pathToSelect)
			setSelectedPath(
				context,
				getSelectedComponentPath(pathToSelect, def)
			)
		}
	}

	const onDragLeave = (e: DragEvent) => {
		if (e.target === e.currentTarget) {
			setDropPath(context)
			contentRef.current?.classList.add("pointer-events-none")
			return
		}
		const currentTarget = e.currentTarget as HTMLDivElement
		const bounds = currentTarget.getBoundingClientRect()
		const outsideLeft = e.pageX < bounds.left
		const outsideRight = e.pageX > bounds.right
		const outsideTop = e.pageY < bounds.top
		const outsideBottom = e.pageY > bounds.bottom
		if (outsideLeft || outsideRight || outsideTop || outsideBottom) {
			setDropPath(context)
			contentRef.current?.classList.add("pointer-events-none")
		}
	}

	const onDragEnter = () => {
		contentRef.current?.classList.remove("pointer-events-none")
	}

	const onDrop = (e: DragEvent) => {
		getDropHandler(context, dragPath, dropPath)(e)
		contentRef.current?.classList.add("pointer-events-none")
	}

	return (
		<div
			onDragOver={getDragOverHandler(context, dragPath, dropPath)}
			onDragLeave={onDragLeave}
			onDragEnter={onDragEnter}
			onDrop={onDrop}
			onClick={onClick}
			className={classes.root}
		>
			<div className={classes.scrollwrapper}>
				<div className={classes.outerwrapper}>
					<div ref={contentRef} className={classes.contentwrapper}>
						{props.children}
						<SelectBorder viewdef={viewDef} context={context} />
					</div>
				</div>
			</div>
			{/*<DebugPanel context={context} />*/}
		</div>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
