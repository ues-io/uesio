import { FunctionComponent, DragEvent, MouseEvent } from "react"
import { definition, styles, api, context as ctx, component } from "@uesio/ui"
import {
	getComponentDef,
	setDropPath,
	setDragPath,
	useBuilderState,
	useDragPath,
	useDropPath,
	setSelectedPath,
} from "../../api/stateapi"
import { add, move } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { batch } from "react-redux"
import SelectBorder from "./selectborder"

const isDropAllowed = (accepts: string[], dragNode: FullPath): boolean => {
	for (const accept of accepts) {
		if (accept === dragNode.itemType) return true
	}
	return false
}

const addComponentToCanvas = (
	context: ctx.Context,
	drag: FullPath,
	drop: FullPath,
	extraDef?: definition.Definition
) => {
	const componentDef = getComponentDef(drag.itemName)
	if (!componentDef) return
	batch(() => {
		add(context, drop, {
			[drag.itemName]: {
				...(componentDef.defaultDefinition || {}),
				...(extraDef || {}),
			},
		})
		setDropPath(context)
		setDragPath(context)
	})
}

const handleDrop = (
	drag: FullPath,
	drop: FullPath,
	context: ctx.Context
): void => {
	switch (drag.itemType) {
		case "component":
		case "componentvariant": {
			addComponentToCanvas(
				context,
				drag,
				drop,
				drag.itemType === "componentvariant"
					? {
							[component.STYLE_VARIANT]: drag.localPath,
					  }
					: {}
			)
			break
		}
		case "viewdef": {
			const [, parent] = drag.pop()
			batch(() => {
				move(context, parent, drop)
				setDropPath(context)
				setDragPath(context)
			})
			break
		}
	}
}

// This function uses the mouse position and the bounding boxes of the slot's
// children to determine the index of the drop.
const getDragIndex = (slotTarget: Element | null, e: DragEvent): number => {
	let index = 0
	if (!slotTarget) return index
	const dataDirection =
		slotTarget.getAttribute("data-direction") === "HORIZONTAL"
			? "HORIZONTAL"
			: "VERTICAL"

	// loop over targets children
	for (const child of Array.from(slotTarget.children)) {
		// If the child was a placeholder, and not a real component
		// in this slot, we can skip it.
		for (const grandchild of Array.from(child.children)) {
			if (grandchild.getAttribute("data-placeholder") === "true") continue

			// If we're a real component, we need to find the midpoint of our
			// position, and see if the cursor is greater than or less than it.
			const bounds = grandchild.getBoundingClientRect()

			const isChildBeforePosition =
				dataDirection === "HORIZONTAL"
					? bounds.left + bounds.width / 2 <= e.pageX + window.scrollX
					: bounds.top + bounds.height / 2 <= e.pageY + window.scrollY

			if (!isChildBeforePosition) break
			index++
		}
	}

	return index
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

		// Step 1: Find the closest slot that is accepting the current dragpath.
		let slotTarget = e.target as Element | null
		let validPath = ""
		while (slotTarget !== null && slotTarget !== e.currentTarget) {
			const accepts = slotTarget.getAttribute("data-accepts")?.split(",")
			if (accepts && isDropAllowed(accepts, dragPath)) {
				validPath = slotTarget.getAttribute("data-path") || ""
				break
			}
			slotTarget = slotTarget.parentElement || null
		}

		if (validPath && dropPath && dragPath) {
			const index = getDragIndex(slotTarget, e)

			const usePath = `${validPath}["${index}"]`

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
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
			onDrop={onDrop}
			onClick={onClick}
			className={classes.root}
		>
			<div className={classes.scrollwrapper}>
				<div className={classes.outerwrapper}>
					<div className={classes.contentwrapper}>
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
