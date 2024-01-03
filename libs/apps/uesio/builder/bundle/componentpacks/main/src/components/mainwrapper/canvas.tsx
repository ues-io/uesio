import {
	DragEvent,
	FunctionComponent,
	MouseEvent,
	RefObject,
	useRef,
} from "react"
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

const classesToPreventDOMInteraction = ["pointer-events-none"]

const disableDOMInteraction = (ref: RefObject<HTMLDivElement>) => {
	ref.current?.classList.add(...classesToPreventDOMInteraction)
}

const enableDOMInteraction = (ref: RefObject<HTMLDivElement>) => {
	ref.current?.classList.remove(...classesToPreventDOMInteraction)
}

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
			root: ["overflow-hidden", "h-full", "relative", "bg-white", "p-12"],

			scrollwrapper: ["overflow-auto", "h-full", "w-full"],

			outerwrapper: [
				"relative",
				"overflow-auto",
				"bg-white",
				`w-[${width ? width + "px" : "100%"}]`,
				`h-[${height ? height + "px" : "100%"}]`,
				"mx-auto",
				"transition-all",
			],
			contentwrapper: [
				"overflow-auto",
				"h-full",
				"[container-type:inline-size]",
				height && "border-y",
				width && "border-x",
				"border-dashed",
				"border-slate-300",
				...classesToPreventDOMInteraction,
			],
			line: ["absolute", "border-dashed", "border-slate-300"],
			top: ["right-0", "left-0", "top-12", "border-t"],
			bottom: ["right-0", "left-0", "bottom-12", "border-b"],
			left: ["top-0", "bottom-0", "left-12", "border-l"],
			right: ["top-0", "bottom-0", "right-12", "border-r"],
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
		enableDOMInteraction(contentRef)
		let target = document.elementFromPoint(e.clientX, e.clientY)
		disableDOMInteraction(contentRef)
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
			disableDOMInteraction(contentRef)
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
			disableDOMInteraction(contentRef)
		}
	}

	const onDragEnter = () => {
		enableDOMInteraction(contentRef)
	}

	const onDrop = (e: DragEvent) => {
		getDropHandler(context, dragPath, dropPath)(e)
		disableDOMInteraction(contentRef)
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
			{!height && (
				<>
					<div className={styles.cx(classes.line, classes.top)} />
					<div className={styles.cx(classes.line, classes.bottom)} />
				</>
			)}
			{!width && (
				<>
					<div className={styles.cx(classes.line, classes.left)} />
					<div className={styles.cx(classes.line, classes.right)} />
				</>
			)}
			{/*<DebugPanel context={context} />*/}
		</div>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
