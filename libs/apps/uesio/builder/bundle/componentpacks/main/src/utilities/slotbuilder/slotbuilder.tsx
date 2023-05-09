import { definition, component, styles } from "@uesio/ui"
import { FunctionComponent, useEffect, useRef } from "react"
import { FullPath } from "../../api/path"
import { getBuildMode, useDragPath, useDropPath } from "../../api/stateapi"
import BuildWrapper from "../buildwrapper/buildwrapper"
import PlaceHolder from "../placeholder/placeholder"

const accepts = ["component", "viewdef" /* "componentvariant"*/]

const StyleDefaults = Object.freeze({
	slotDragging: [
		"relative",
		"pt-[33px]",
		"before:absolute",
		"before:content-[attr(data-title)]",
		"before:text-[7pt]",
		"before:uppercase",
		"before:text-slate-700",
		"before:block",
		"before:top-0",
		"before:left-0",
		"before:right-0",
		"before:p-2",
		"before:bg-slate-100",
		"before:leading-none",
		"before:border-b",
		"before:border-b-slate-300",
		"before:border-t-[6px]",
		"before:border-t-white",
	],
	slotAlways: ["transition-all"],
	placeholder: [],
})

const SlotBuilder: FunctionComponent<component.SlotUtilityProps> = (props) => {
	const { definition, listName, path, direction, label, context } = props

	const buildMode = getBuildMode(context)

	const ref = useRef<HTMLDivElement>(null)

	const listDef = (definition?.[listName] || []) as definition.DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const size = listDef.length
	const viewDefId = context.getViewDefId()

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const dropPath = useDropPath(context)
	const dragPath = useDragPath(context)
	const isDragging = dragPath.isSet()
	const isHovering = dropPath.equals(
		new FullPath("viewdef", viewDefId, `${listPath}["0"]`)
	)

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (!parentElem) return
		parentElem.setAttribute("data-accepts", accepts.join(","))
		parentElem.setAttribute("data-direction", direction || "")
		parentElem.setAttribute("data-path", listPath)
		parentElem.setAttribute("data-title", label || `${listName} slot`)
		parentElem.classList.add(...StyleDefaults.slotAlways)
	}, [listPath, listName, label, direction])

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (!parentElem) return
		isDragging
			? parentElem.classList.add(...StyleDefaults.slotDragging)
			: parentElem.classList.remove(...StyleDefaults.slotDragging)
	}, [isDragging])

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
			<div
				data-placeholder="true"
				ref={ref}
				style={{ display: "none" }}
			/>
			{size === 0 && (
				<PlaceHolder
					label={"Empty Component Area"}
					isHovering={isHovering}
					context={context}
					direction={direction}
					className={classes.placeholder}
				/>
			)}
			{component.getSlotProps(props).map((props, index) => (
				<BuildWrapper key={index} {...props}>
					<component.Component {...props} />
				</BuildWrapper>
			))}
		</>
	)
}

export default SlotBuilder
