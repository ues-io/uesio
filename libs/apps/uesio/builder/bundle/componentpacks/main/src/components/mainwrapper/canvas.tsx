import { FunctionComponent, DragEvent } from "react"
import { definition, component, styles, api, context as ctx } from "@uesio/ui"
import { isDropAllowed, isNextSlot } from "../../shared/dragdrop"
import PanelPortal from "../../shared/panelportal"
import TopActions from "../../shared/topactions"
import BottomActions from "../../shared/bottomactions"
import {
	getComponentDef,
	setDropPath,
	setDragPath,
	useBuilderState,
	useDragPath,
	useDropPath,
} from "../../api/stateapi"
import { add, move } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { batch } from "react-redux"

const handleDrop = (
	drag: FullPath,
	drop: FullPath,
	context: ctx.Context
): void => {
	switch (drag.itemType) {
		case "component": {
			const componentDef = getComponentDef(context, drag.itemName)
			if (!componentDef) return
			batch(() => {
				add(context, drop, {
					[drag.itemName]: componentDef.defaultDefinition || {},
				})
				setDropPath(context)
				setDragPath(context)
			})
			break
		}
		case "viewdef": {
			const [key, parent] = drag.pop()
			batch(() => {
				move(context, parent, drop, key)
				setDropPath(context)
				setDragPath(context)
			})
			break
		}
	}
}

const getIndex = (
	target: Element | null,
	prevTarget: Element | null,
	e: DragEvent
): number => {
	const dataDirection =
		target?.getAttribute("data-direction") === "HORIZONTAL"
			? "HORIZONTAL"
			: "VERTICAL"
	if (!prevTarget) {
		const bounds = target?.getBoundingClientRect()
		// This code is for when we're dropping between gaps in components.
		// It allows us to have gaps between components with out that annoying
		// jitter.
		if (bounds && target) {
			let index: string | null = null
			// loop over targets children
			for (const child of Array.from(target.children)) {
				const childBounds = child.getBoundingClientRect()
				const childIndex = child.getAttribute("data-index")
				if (childIndex === null || childIndex === undefined) continue
				// I'm not sure exactly why we need this offset
				// but it helps reduce the jitter. I think it has something
				// to do with the border of the child elements.
				const offset = 1
				const isChildBeforePosition =
					dataDirection === "HORIZONTAL"
						? childBounds.right - offset <= e.pageX + window.scrollX
						: childBounds.bottom - offset <=
						  e.pageY + window.scrollY

				if (isChildBeforePosition) {
					index = childIndex
					continue
				}

				break
			}
			if (index) {
				return parseInt(index, 10)
			}
		}
		// If we can't figure out what the index is, fall back to zero
		return 0
	}
	const dataIndex = prevTarget.getAttribute("data-index")
	const dataPlaceholder = prevTarget.getAttribute("data-placeholder")

	if (!dataIndex) return 0
	const index = parseInt(dataIndex, 10)
	if (dataPlaceholder === "true") {
		return index
	}
	const bounds = prevTarget.getBoundingClientRect()
	return isNextSlot(bounds, dataDirection, e.pageX, e.pageY)
		? index + 1
		: index
}

const Canvas: FunctionComponent<definition.UtilityProps> = (props) => {
	const context = props.context

	const [dimensions] = useBuilderState<[number, number]>(
		context,
		"dimensions"
	)

	const width = dimensions && dimensions[0]
	const height = dimensions && dimensions[1]

	const classes = styles.useUtilityStyles(
		{
			root: {
				overflow: "hidden",
				height: "100%",
				padding: "30px 18px",
				position: "relative",
			},

			scrollwrapper: {
				overflow: "auto",
				height: "100%",
				width: "100%",
				padding: "8px",
			},

			outerwrapper: {
				position: "relative",
				borderRadius: "8px",
				overflow: "auto",
				boxShadow: "rgb(0 0 0 / 10%) 0px 0px 8px",
				background: "white",
				width: width ? width + "px" : "100%",
				height: height ? height + "px" : "100%",
				margin: "0 auto",
				transition: "all 0.3s ease",
			},
			contentwrapper: {
				overflow: "auto",
				height: "100%",
			},
		},
		props
	)

	const dragPath = useDragPath(context)
	const dropPath = useDropPath(context)

	const viewDefId = context.getViewDefId()
	const viewDef = api.view.useViewDef(viewDefId)
	const route = context.getRoute()

	if (!route || !viewDefId || !viewDef) return null

	// Handle the situation where a draggable leaves the canvas.
	// If the cursor is outside of the canvas's bounds, then clear
	// out the drop node.
	const onDragLeave = (e: DragEvent) => {
		if (e.target === e.currentTarget) {
			setDropPath(context)
		} else {
			const currentTarget = e.currentTarget as HTMLDivElement
			const bounds = currentTarget.getBoundingClientRect()
			const outsideLeft = e.pageX < bounds.left
			const outsideRight = e.pageX > bounds.right
			const outsideTop = e.pageY < bounds.top
			const outsideBottom = e.pageY > bounds.bottom
			if (outsideLeft || outsideRight || outsideTop || outsideBottom) {
				setDropPath(context)
			}
		}
	}
	// Handle the situation where no other slots are accepting draggable
	// items. This clears out the current drop node so that our slot
	// acceptance indicators go away.
	const onDragOver = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()

		let target = e.target as Element | null
		let prevTarget = null as Element | null
		let validPath = ""
		while (target !== null && target !== e.currentTarget) {
			const accepts = target.getAttribute("data-accepts")?.split(",")
			if (accepts && isDropAllowed(accepts, dragPath)) {
				validPath = target.getAttribute("data-path") || ""
				break
			}
			prevTarget = target
			target = target.parentElement || null
		}

		if (validPath && dropPath && dragPath) {
			const index = getIndex(target, prevTarget, e)
			let usePath = `${validPath}["${index}"]`
			if (usePath === component.path.getParentPath(dragPath.localPath)) {
				// Don't drop on ourselfs, just move to the next index
				usePath = `${validPath}["${index + 1}"]`
			}
			if (dropPath.localPath !== usePath) {
				setDropPath(
					context,
					new FullPath("viewdef", viewDefId, usePath)
				)
			}
			return
		}

		if (!dropPath) {
			setDropPath(context)
		}
	}

	const onDrop = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!dropPath || !dragPath) {
			return
		}
		handleDrop(dragPath, dropPath, context)
	}

	return (
		<div
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
			onDrop={onDrop}
			className={classes.root}
		>
			<TopActions context={context} />
			<div className={classes.scrollwrapper}>
				<div className={classes.outerwrapper}>
					<div className={classes.contentwrapper}>
						{props.children}
					</div>
				</div>
			</div>
			<BottomActions context={context} />
			<PanelPortal context={context} />
		</div>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
