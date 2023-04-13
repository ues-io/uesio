import { definition, component } from "@uesio/ui"
import { FunctionComponent, useEffect, useRef } from "react"
import { FullPath } from "../../api/path"
import { getBuildMode, useDragPath, useDropPath } from "../../api/stateapi"
import { isDropAllowed } from "../../shared/dragdrop"
import BuildWrapper from "../buildwrapper/buildwrapper"
import PlaceHolder from "../placeholder/placeholder"

const SlotBuilder: FunctionComponent<component.SlotUtilityProps> = (props) => {
	const { definition, listName, path, direction, label, message, context } =
		props

	const buildMode = getBuildMode(context)

	const ref = useRef<HTMLDivElement>(null)

	const listDef = (definition?.[listName] || []) as definition.DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const size = listDef.length
	const viewDefId = context.getViewDefId()

	const dragPath = useDragPath(context)
	const dropPath = useDropPath(context)

	const accepts = ["component", "viewdef" /* "componentvariant"*/]

	const isHovering =
		dropPath.equals(
			new FullPath("viewdef", viewDefId, `${listPath}["0"]`)
		) && isDropAllowed(accepts, dragPath)

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (parentElem) {
			parentElem.setAttribute("data-accepts", accepts.join(","))
			parentElem.setAttribute("data-direction", direction || "")
			parentElem.setAttribute("data-path", listPath)
		}
	}, [path, accepts, direction])

	if (!buildMode) {
		return (
			<>
				{component.getSlotProps(props).map((props, index) => (
					<component.Component key={index} {...props} />
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
						<component.Component {...props} />
					</BuildWrapper>
				))}
			</>
		</>
	)
}

export default SlotBuilder
