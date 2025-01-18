import { context, definition, component } from "@uesio/ui"
import { getComponentDef, setDragPath, setDropPath } from "../api/stateapi"
import { FullPath } from "../api/path"
import { DragEventHandler, DragEvent } from "react"
import { add, move } from "../api/defapi"

const CURSOR_GRABBING = "cursor-grabbing"

const standardAccepts = ["component", "viewdef", "componentvariant"]

const isDropAllowed = (accepts: string[], dragNode: FullPath): boolean => {
  for (const accept of accepts) {
    if (accept === dragNode.itemType) return true
  }
  return false
}

// This function uses the mouse position and the bounding boxes of the slot's
// children to determine the index of the drop.
const getDragIndex = (slotTarget: Element | null, e: DragEvent): number => {
  let index = 0
  if (!slotTarget) return index
  const dataDirection =
    slotTarget.getAttribute("data-direction") === "HORIZONTAL"
      ? "HORIZONTAL"
      : "VERTICAL"

  // loop over targets children
  for (const child of Array.from(slotTarget.children)) {
    // If the child was a placeholder, and not a real component
    // in this slot, we can skip it.
    for (const grandchild of Array.from(child.children)) {
      if (grandchild.getAttribute("data-placeholder") === "true") continue

      // If we're a real component, we need to find the midpoint of our
      // position, and see if the cursor is greater than or less than it.
      const bounds = grandchild.getBoundingClientRect()

      const isChildBeforePosition =
        dataDirection === "HORIZONTAL"
          ? bounds.left + bounds.width / 2 <= e.pageX + window.scrollX
          : bounds.top + bounds.height / 2 <= e.pageY + window.scrollY

      if (!isChildBeforePosition) break
      index++
    }
  }

  return index
}

const getDragStartHandler =
  (context: context.Context): DragEventHandler =>
  (e) => {
    const target = e.target as HTMLDivElement
    if (target && target.dataset.type) {
      const typeArray = target.dataset.type.split(":")
      const metadataType = typeArray.shift()
      const metadataItem = typeArray.join(":")
      if (metadataType && metadataItem) {
        setDragPath(context, new FullPath(metadataType, metadataItem))
      }
      target.classList.remove(CURSOR_GRABBING)
      target.classList.add(CURSOR_GRABBING)
    }
  }

const getDragEndHandler =
  (context: context.Context): DragEventHandler =>
  (e) => {
    setDragPath(context)
    setDropPath(context)
    const target = e.target as HTMLDivElement
    if (target?.classList?.length) {
      target.classList.remove(CURSOR_GRABBING)
    }
  }

const addComponentToCanvas = (
  context: context.Context,
  componentType: string,
  drop: FullPath,
  extraDef?: definition.Definition,
) => {
  const componentDef = getComponentDef(componentType)
  if (!componentDef) return

  add(context, drop, {
    [componentType]: {
      ...(componentDef.defaultDefinition || {}),
      ...(extraDef || {}),
    },
  })
  setDropPath(context)
  setDragPath(context)
}

const handleDrop = (
  drag: FullPath,
  drop: FullPath,
  context: context.Context,
): void => {
  switch (drag.itemType) {
    case "component":
    case "componentvariant": {
      addComponentToCanvas(
        context,
        drag.itemName,
        drop,
        drag.itemType === "componentvariant"
          ? {
              [component.STYLE_VARIANT]: drag.localPath,
            }
          : {},
      )
      break
    }
    case "viewdef": {
      const [, parent] = drag.pop()

      move(context, parent, drop)
      setDropPath(context)
      setDragPath(context)

      break
    }
  }
}

const getDragOverHandler =
  (
    context: context.Context,
    dragPath: FullPath,
    dropPath: FullPath,
  ): DragEventHandler =>
  (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Step 1: Find the closest slot that is accepting the current dragpath.
    let slotTarget = e.target as Element | null
    let validPath = ""
    while (slotTarget !== null) {
      const accepts = slotTarget.getAttribute("data-accepts")?.split(",")
      if (accepts && isDropAllowed(accepts, dragPath)) {
        validPath = component.path.fromDataAttrPath(
          slotTarget.getAttribute("data-path"),
        )
        break
      }
      if (slotTarget === e.currentTarget) {
        break
      }
      slotTarget = slotTarget.parentElement || null
    }

    if (validPath && dropPath && dragPath) {
      const index = getDragIndex(slotTarget, e)

      const usePath = `${validPath}["${index}"]`

      if (dropPath.localPath !== usePath) {
        setDropPath(
          context,
          new FullPath("viewdef", context.getViewDefId(), usePath),
        )
      }
      return
    }

    if (!dropPath) {
      setDropPath(context)
    }
  }

const getDropHandler =
  (
    context: context.Context,
    dragPath: FullPath,
    dropPath: FullPath,
  ): DragEventHandler =>
  (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dropPath || !dragPath) {
      return
    }
    handleDrop(dragPath, dropPath, context)
  }

export {
  getDragStartHandler,
  getDragEndHandler,
  getDragOverHandler,
  getDropHandler,
  standardAccepts,
  addComponentToCanvas,
}
