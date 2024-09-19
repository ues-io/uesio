import { definition, component } from "@uesio/ui"
import { FunctionComponent, useEffect, useRef } from "react"
import { FullPath } from "../../api/path"
import { getBuildMode, getComponentDef, useDropPath } from "../../api/stateapi"
import BuildWrapper from "../buildwrapper/buildwrapper"
import PlaceHolder from "../placeholder/placeholder"
import { DeclarativeComponentSlotLoaderId } from "../declarativecomponentslotloader/declarativecomponentslotloader"
import { InnerViewSlotLoaderId } from "../innerviewslotloader/innerviewslotloader"
import { standardAccepts } from "../../helpers/dragdrop"

export const SlotBuilderComponentId = "uesio/builder.slotbuilder"

const SlotBuilder: FunctionComponent<component.SlotUtilityProps> = (props) => {
	const {
		context,
		definition,
		listName = component.DefaultSlotName,
		path,
		componentType,
		readonly,
	} = props

	const buildMode = getBuildMode(context)

	const ref = useRef<HTMLDivElement>(null)

	const listDef = (definition?.[listName] || []) as definition.DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	const size = listDef.length
	const viewDefId = context.getViewDefId()

	const dropPath = useDropPath(context)
	const isHovering = dropPath.equals(
		new FullPath("viewdef", viewDefId, `${listPath}["0"]`)
	)

	const slotDef = getComponentDef(componentType)?.slots?.find(
		(slotDef) => slotDef.name === listName
	)

	const direction = slotDef?.direction || "VERTICAL"
	const label = slotDef?.label || "Empty Component Area"

	useEffect(() => {
		const parentElem = ref?.current?.parentElement
		if (!parentElem) return
		parentElem.setAttribute("data-accepts", standardAccepts.join(","))
		parentElem.setAttribute("data-direction", direction)
		parentElem.setAttribute(
			"data-path",
			component.path.toDataAttrPath(listPath)
		)
		parentElem.setAttribute("data-title", label)
	}, [listPath, listName, label, direction])

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
					label={label}
					isHovering={isHovering}
					context={context}
					direction={direction}
				/>
			)}
			{component.getSlotProps(props).map((props, index) => {
				let childrenContext = context
				// When rendering a Declarative Component, use a custom slot loader for the children
				if (
					getComponentDef(props.componentType)?.type ===
					component.Declarative
				) {
					childrenContext = context.setCustomSlotLoader(
						DeclarativeComponentSlotLoaderId
					)
				}
				// If we're using a subview
				if (props.componentType === component.ViewComponentId) {
					childrenContext = context.setCustomSlotLoader(
						InnerViewSlotLoaderId
					)
				}
				if (readonly) {
					return (
						<component.Component
							key={index}
							{...props}
							context={childrenContext}
						/>
					)
				}
				return (
					<BuildWrapper key={index} {...props}>
						<component.Component
							{...props}
							context={childrenContext}
						/>
					</BuildWrapper>
				)
			})}
		</>
	)
}

export default SlotBuilder
