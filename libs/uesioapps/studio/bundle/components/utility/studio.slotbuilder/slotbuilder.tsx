import { definition, component, hooks, styles } from "@uesio/ui"
import { FunctionComponent, useEffect } from "react"
import { isDropAllowed } from "../../shared/dragdrop"

const SlotBuilder: FunctionComponent<component.SlotUtilityProps> = (props) => {
	const { parentRef, accepts, definition, listName, path, direction } = props

	const uesio = hooks.useUesio(props)
	const listDef = (definition?.[listName] || []) as definition.DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const size = listDef.length

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const [dropType, dropItem, dropPath] = uesio.builder.useDropNode()
	const fullDragPath = component.path.makeFullPath(
		dragType,
		dragItem,
		dragPath
	)

	const classes = styles.useStyles(
		{
			placeholder: {
				...(dropPath === `${listPath}["0"]` && {
					border: "1px dashed #ccc",
					backgroundColor: "#e5e5e5",
				}),
				minWidth: "40px",
				minHeight: "40px",
			},
		},
		props
	)

	useEffect(() => {
		const parentElem = parentRef?.current
		if (parentElem) {
			parentElem.setAttribute("data-accepts", accepts.join(","))
			parentElem.setAttribute("data-direction", direction || "")
			parentElem.setAttribute("data-path", listPath)
			parentElem.setAttribute("data-insertindex", size + "")
		}
	}, [])

	return (
		<>
			{size === 0 && isDropAllowed(accepts, fullDragPath) && (
				<div className={classes.placeholder} />
			)}
			{props.children}
		</>
	)
}

export default SlotBuilder
