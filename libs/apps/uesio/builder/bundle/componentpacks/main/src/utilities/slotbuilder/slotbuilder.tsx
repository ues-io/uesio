import { definition, component } from "@uesio/ui"
import { FunctionComponent } from "react"
import { FullPath } from "../../api/path"
import {
  getBuildMode,
  getComponentDef,
  useDragPath,
  useDropPath,
} from "../../api/stateapi"
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

  const listDef = (definition?.[listName] || []) as definition.DefinitionList
  const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
  const size = listDef.length
  const viewDefId = context.getViewDefId()

  const dropPath = useDropPath(context)
  const dragPath = useDragPath(context)
  const isDragging = dragPath.isSet()
  const isHovering = dropPath.equals(
    new FullPath("viewdef", viewDefId, `${listPath}["0"]`),
  )

  const slotDef = getComponentDef(componentType)?.slots?.find(
    (slotDef) => slotDef.name === listName,
  )

  const direction = slotDef?.direction || "VERTICAL"
  const label = slotDef?.label || "Empty Component Area"

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
    <div
      data-accepts={readonly ? "" : standardAccepts}
      data-direction={direction}
      data-path={readonly ? "" : component.path.toDataAttrPath(listPath)}
      style={{ display: "contents" }}
    >
      {!readonly && size === 0 && isDragging && (
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
          getComponentDef(props.componentType)?.type === component.Declarative
        ) {
          childrenContext = context.setCustomSlotLoader(
            DeclarativeComponentSlotLoaderId,
          )
        }
        // If we're using a subview
        if (props.componentType === component.ViewComponentId) {
          childrenContext = context.setCustomSlotLoader(InnerViewSlotLoaderId)
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
            <component.Component {...props} context={childrenContext} />
          </BuildWrapper>
        )
      })}
    </div>
  )
}

export default SlotBuilder
