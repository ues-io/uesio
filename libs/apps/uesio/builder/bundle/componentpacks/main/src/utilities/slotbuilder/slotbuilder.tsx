import { definition, component, hooks } from "@uesio/ui"
import { FunctionComponent, useEffect, useRef } from "react"
import { getBuildMode } from "../../components/mainwrapper/mainwrapper"
import { isDropAllowed } from "../../shared/dragdrop"
import PlaceHolder from "../placeholder/placeholder"

const BuildWrapper = component.getUtility("uesio/builder.buildwrapper")

const SlotBuilder: FunctionComponent<component.SlotUtilityProps> = (props) => {
	const {
		accepts,
		definition,
		listName,
		path,
		direction,
		label,
		message,
		context,
	} = props

	const uesio = hooks.useUesio(props)

	const buildMode = getBuildMode(context)

	const ref = useRef<HTMLDivElement>(null)

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

	const isHovering =
		dropPath === `${listPath}["0"]` && isDropAllowed(accepts, fullDragPath)

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (parentElem) {
			parentElem.setAttribute("data-accepts", accepts.join(","))
			parentElem.setAttribute("data-direction", direction || "")
			parentElem.setAttribute("data-path", listPath)
			parentElem.setAttribute("data-insertindex", size + "")
		}
	}, [path, size, accepts, direction])

	if (!buildMode) {
		return (
			<>
				{component.getSlotProps(props).map((props, index) => (
					<component.Component key={index} index={index} {...props} />
				))}
			</>
		)
	}

	return (
		<>
			<div ref={ref} style={{ display: "contents" }} />
			{size === 0 && (
				<PlaceHolder
					label={label}
					message={message}
					index={0}
					isHovering={isHovering}
					context={context}
					direction={direction}
				/>
			)}
			<>
				{component.getSlotProps(props).map((props, index) => (
					<BuildWrapper key={index} {...props}>
						<component.Component index={index} {...props} />
					</BuildWrapper>
				))}
			</>
		</>
	)
}

export default SlotBuilder
