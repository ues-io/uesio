import { FC, useState, useEffect, useRef } from "react"
import { TableProps } from "./tabledefinition"
import { component, styles, hooks } from "@uesio/ui"
import empty from "libs/ui/src/bands/wire/operations/empty"
const LabLayout = component.registry.getUtility("lab.layout")

const Grid: FC<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, context, path = "" } = props
	const wire = uesio.wire.useWire(definition.wire)
	const viewDefId = uesio.getViewDefId() || ""

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const classes = styles.useStyles(
		{
			root: {},
			column: {
				flex: 1,
				position: "relative",
			},
			dragIndicator: {
				position: "absolute",
				inset: "0 0 0 0",
				backgroundColor: "rgba(0, 0, 0, 0.25)",
			},
		},
		props
	)
	const records = wire?.getData() || []

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	// ===
	const [dragCol, setDragCol] = useState<number | null>(null)
	const [slideX, setSlideX] = useState<number>(0)
	const [showMarker, setShowMarker] = useState<number | null>(null)
	const mouseDown = (index: number) => {
		setDragCol(index)
	}
	const mouseUp = () => {
		if (showMarker !== null && dragCol !== null) {
			uesio.builder.moveDefinition(
				component.path.makeFullPath(
					metadataType,
					metadataItem,
					`${path}["columns"]["${dragCol}"]`
				),
				component.path.makeFullPath(
					metadataType,
					metadataItem,
					`${path}["columns"]["${showMarker}"]`
				)
			)
		}
		setDragCol(null)
	}

	const headerRefs = useRef<HTMLDivElement[]>([])

	useEffect(() => {
		console.log({ h: headerRefs.current })
	}, [headerRefs.current])

	useEffect(() => {
		if (dragCol === null) return
		let start = 0
		const handler = (e: any) => {
			console.log("hey", dragCol)
			const mouseX = e.clientX

			if (start === 0) {
				start = mouseX
			}
			setSlideX(mouseX - start)

			const leftRightBounds = headerRefs.current.map((el, i) => {
				const { left, right } = el.getBoundingClientRect()
				return { left, right, i }
			})

			const hoveredEl = leftRightBounds.find(
				({ left, right }) => left < mouseX && right > mouseX
			)
			console.log({ leftRightBounds, hoveredEl })
			if (!hoveredEl) return

			setShowMarker(hoveredEl.i)
		}

		window.addEventListener("mousemove", handler)
		return () => {
			window.removeEventListener("mousemove", handler)
			setShowMarker(null)
		}
	}, [dragCol])

	const collection = wire?.getCollection()

	return (
		<div className={classes.root}>
			{/* row */}
			{/* row column */}
			<LabLayout classes={classes} context={props.context}>
				{definition.columns.length &&
					definition.columns.map((c, index) => {
						const column = Object.values(c)[0]
						return (
							<div
								key={index}
								className={classes.column}
								style={{
									order: column.order || "initial",
									padding: "10px",
									backgroundColor: "#eee",
									borderLeft:
										index === showMarker
											? "8px solid orange"
											: "initial",
								}}
								onMouseDown={() => mouseDown(index)}
								onClick={(e) => {
									e.stopPropagation()
									uesio.builder.setSelectedNode(
										metadataType,
										metadataItem,
										`${path}["columns"]["${index}"]["lab.tablecolumn"]`
									)
								}}
								onMouseUp={() => mouseUp()}
								ref={(el) =>
									el &&
									!headerRefs.current.includes(el) &&
									headerRefs.current.push(el)
								}
							>
								<div
									style={{
										opacity: dragCol === index ? 1 : 0,
										transform: `translateX(${slideX}px)`,
									}}
									className={classes.dragIndicator}
								/>
								{column.name ||
									(collection &&
										collection
											.getField(column.field)
											?.getLabel())}
							</div>
						)
					})}
			</LabLayout>

			{records.map((record) => {
				const rowContext = context.addFrame({
					record: record.getId(),
					wire: wire?.getId() || "",
					fieldMode: "READ",
				})

				return (
					<LabLayout
						key={record.getId()}
						classes={classes}
						context={props.context}
					>
						<component.Slot
							definition={definition}
							listName="columns"
							path={path}
							accepts={["uesio.tablecolumn"]}
							context={rowContext}
						/>
						{/* {definition.columns.map((column, index) => {
							console.log({ column })
							return (
								// <div className={classes.column}>
								<component.Slot
									definition={column}
									listName="columns"
									path={path}
									accepts={["uesio.tablecolumn"]}
									context={rowContext}
								/>
								// </div>
							)
						})} */}
					</LabLayout>
				)
			})}
		</div>
	)
}

export default Grid
