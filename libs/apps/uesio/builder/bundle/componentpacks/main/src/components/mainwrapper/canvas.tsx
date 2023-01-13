import { FunctionComponent, DragEvent } from "react"
import { definition, component, styles, context as ctx } from "@uesio/ui"
import { isDropAllowed, isNextSlot } from "../../shared/dragdrop"
import PanelPortal from "../../shared/panelportal"
import TopActions from "../../shared/topactions"
import BottomActions from "../../shared/bottomactions"
import {
	getComponentDef,
	useBuilderState,
	useDragPath,
	useDropPath,
} from "../../api/stateapi"
import { add } from "../../api/defapi"
import { FullPath } from "../../api/path"

const handleDrop = (
	drag: FullPath,
	drop: FullPath,
	context: ctx.Context
): void => {
	switch (drag.itemType) {
		case "component": {
			const [index, parentDrop] = drop.popIndex()
			const componentDef = getComponentDef(context, drag.itemName)
			if (!componentDef) return
			add(
				parentDrop,
				{
					[`${componentDef.namespace}.${componentDef.name}`]: {},
				},
				index
			)
		}
	}

	/*
	const [propDef] =
		component.registry.getPropertiesDefinitionFromPath(dragNode)

	api.builder.clearDragNode()
	api.builder.clearDropNode()

	if (!propDef) {
		console.log("No prop def found")
		return
	}

	const [metadataType, metadataItem] =
		component.path.getFullPathParts(dragNode)

	switch (metadataType) {
		case "field": {
			const [dropPropDef] =
				component.registry.getPropertiesDefinitionFromPath(dropNode)
			const handler = dropPropDef?.handleFieldDrop
			if (handler) {
				handler(dragNode, dropNode, dropIndex, propDef)
			}
			break
		}
		case "component": {
			api.builder.addDefinition(
				dropNode,
				{
					[`${propDef.namespace}.${propDef.name}`]:
						propDef.defaultDefinition(),
				},
				dropIndex,
				metadataType
			)
			break
		}
		case "componentvariant": {
			const [, , variantNamespace, variantName] =
				component.path.parseVariantKey(metadataItem)
			api.builder.addDefinition(
				dropNode,
				{
					[`${propDef.namespace}.${propDef.name}`]: {
						...propDef.defaultDefinition(),
						...{
							[`uesio.variant`]:
								variantNamespace + "." + variantName,
						},
					},
				},
				dropIndex,
				metadataType
			)
			break
		}
		case "viewdef": {
			const key = component.path.getKeyAtPath(dragNode)
			const toPath = `${dropNode}["${dropIndex}"]`
			// Selection Handling
			api.builder.moveDefinition(
				component.path.getParentPath(dragNode),
				toPath,
				key || undefined
			)
			break
		}
	}
	*/
}

const getIndex = (
	target: Element | null,
	prevTarget: Element | null,
	e: DragEvent
): number => {
	if (!prevTarget) {
		const dataInsertIndex = target?.getAttribute("data-insertindex")
		return dataInsertIndex ? parseInt(dataInsertIndex, 10) : 0
	}
	const dataIndex = prevTarget.getAttribute("data-index")
	const dataPlaceholder = prevTarget.getAttribute("data-placeholder")
	const dataDirection =
		target?.getAttribute("data-direction") === "HORIZONTAL"
			? "HORIZONTAL"
			: "VERTICAL"

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
				position: "relative",
			},

			inner: {
				minHeight: "100%",
				padding: "0.05px", // Hack to prevent margin collapse
				position: "relative",
				"&.empty": {
					display: "grid",
				},
			},
		},
		props
	)

	const [dragPath] = useDragPath(context)
	const [dropPath, setDropPath] = useDropPath(context)

	const viewDefId = context.getViewDefId()
	const viewDef = context.getViewDef()
	const route = context.getRoute()

	if (!route || !viewDefId || !viewDef) return null

	const isEmpty = !viewDef.components?.length

	// Handle the situation where a draggable leaves the canvas.
	// If the cursor is outside of the canvas's bounds, then clear
	// out the drop node.
	const onDragLeave = (e: DragEvent) => {
		if (e.target === e.currentTarget) {
			setDropPath()
		} else {
			const currentTarget = e.currentTarget as HTMLDivElement
			const bounds = currentTarget.getBoundingClientRect()
			const outsideLeft = e.pageX < bounds.left
			const outsideRight = e.pageX > bounds.right
			const outsideTop = e.pageY < bounds.top
			const outsideBottom = e.pageY > bounds.bottom
			if (outsideLeft || outsideRight || outsideTop || outsideBottom) {
				setDropPath()
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
				setDropPath(new FullPath("viewdef", viewDefId, usePath))
			}
			return
		}

		if (!dropPath) {
			setDropPath()
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
						<div
							className={styles.cx(
								classes.inner,
								isEmpty && "empty"
							)}
						>
							{props.children}
							<PanelPortal context={context} />
						</div>
					</div>
					<component.PanelArea />
				</div>
			</div>
			<BottomActions context={context} />
		</div>
	)
}
Canvas.displayName = "Canvas"

export default Canvas
