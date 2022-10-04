import { definition, component, hooks, styles } from "@uesio/ui"
import { FunctionComponent, useEffect, useRef } from "react"
import { isDropAllowed } from "../../shared/dragdrop"

const SlotBuilder: FunctionComponent<component.SlotUtilityProps> = (props) => {
	const { accepts, definition, listName, path, direction, label } = props
	const ref = useRef<HTMLDivElement>(null)
	const uesio = hooks.useUesio(props)
	const listDef = (definition?.[listName] || []) as definition.DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const size = listDef.length

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const [, , dropPath] = uesio.builder.useDropNode()
	const fullDragPath = component.path.makeFullPath(
		dragType,
		dragItem,
		dragPath
	)

	const isHovering = dropPath === `${listPath}["0"]`
	const classes = styles.useStyles(
		{
			label: {
				opacity: 0,
				fontSize: "0.7em",
				transition: "all 0.125s ease",
				...(isHovering && {
					opacity: 0.5,
				}),
			},
			placeholder: {
				border: "1px solid rgba(0, 0, 0, 0)",
				transition: "all 0.125s ease",
				paddingLeft: "5px",
				minWidth: "40px",
				minHeight: "40px",
				...(isHovering && {
					border: "1px dashed #ccc",
					backgroundColor: "#e5e5e5",
				}),
			},
		},
		props
	)

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (parentElem) {
			parentElem.setAttribute("data-accepts", accepts.join(","))
			parentElem.setAttribute("data-direction", direction || "")
			parentElem.setAttribute("data-path", listPath)
			parentElem.setAttribute("data-insertindex", size + "")
		}
	}, [path])

	return (
		<>
			<div ref={ref} style={{ display: "contents" }} />
			{size === 0 && isDropAllowed(accepts, fullDragPath) && (
				<div className={classes.placeholder}>
					{label && <span className={classes.label}>{label}</span>}
				</div>
			)}
			{props.children}
		</>
	)
}

export default SlotBuilder
