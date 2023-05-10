import { definition, component, styles } from "@uesio/ui"
import { FunctionComponent, useEffect, useRef } from "react"
import { FullPath } from "../../api/path"
import { getBuildMode, useBuilderState, useDropPath } from "../../api/stateapi"
import BuildWrapper from "../buildwrapper/buildwrapper"
import PlaceHolder from "../placeholder/placeholder"

const accepts = ["component", "viewdef" /* "componentvariant"*/]

const StyleDefaults = Object.freeze({
	slotTagOn: [
		"relative",
		"pt-[29px]",
		"before:absolute",
		"before:content-[attr(data-title)]",
		"before:text-slate-600",
		"before:text-[8pt]",
		"before:uppercase",
		"before:block",
		"before:top-0",
		"before:left-0",
		"before:right-0",
		"before:p-2",
		"before:leading-none",
		"before:bg-slate-100",
		"before:border-b",
		"before:border-slate-300",
	],
	slotTag: ["transition-all"],
})

const SlotBuilder: FunctionComponent<component.SlotUtilityProps> = (props) => {
	const { definition, listName, path, direction, label, context } = props

	const buildMode = getBuildMode(context)

	const ref = useRef<HTMLDivElement>(null)

	const listDef = (definition?.[listName] || []) as definition.DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const size = listDef.length
	const viewDefId = context.getViewDefId()

	styles.useUtilityStyleTokens(StyleDefaults, props)

	const dropPath = useDropPath(context)
	const isHovering = dropPath.equals(
		new FullPath("viewdef", viewDefId, `${listPath}["0"]`)
	)

	const [showSlotTags] = useBuilderState<boolean>(props.context, "slottags")

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (!parentElem) return
		parentElem.setAttribute("data-accepts", accepts.join(","))
		parentElem.setAttribute("data-direction", direction || "")
		parentElem.setAttribute("data-path", listPath)
		parentElem.setAttribute("data-title", label || `${listName} slot`)
		parentElem.classList.add(...StyleDefaults.slotTag)
	}, [listPath, listName, label, direction])

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (!parentElem) return
		showSlotTags
			? parentElem.classList.add(...StyleDefaults.slotTagOn)
			: parentElem.classList.remove(...StyleDefaults.slotTagOn)
	}, [showSlotTags])

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
