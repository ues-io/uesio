import { definition, context, styles } from "@uesio/ui"
import PlaceHolder from "../placeholder/placeholder"
import { useDropPath, useSelectedComponentPath } from "../../api/stateapi"
import { FullPath } from "../../api/path"
import { useEffect, useRef } from "react"

const StyleDefaults = Object.freeze({
  root: ["contents"],
  wrapper: ["relative"],
  inner: ["absolute", "inset-0", "pointer-events-none", "z-10"],
  selected: [
    "outline-accent-600/50",
    "outline",
    "outline-8",
    "-outline-offset-[8px]",
  ],
  unselected: [],
  emptyWrapper: ["min-h-[40px]"],
  emptyInner: [
    "after:content-[attr(uesiolabel)]",
    "grid",
    "justify-right",
    "items-top",
    "font-light",
    "text-slate-600/50",
    "text-xs",
    "py-3",
    "px-4",
    "outline-slate-300/20",
    "outline",
    "outline-8",
    "-outline-offset-[8px]",
  ],
})

const makeSelectBorder = (
  element: Element,
  isSelected: boolean,
  componentType: string | undefined,
  classes: {
    wrapper: string
    theme: string
    emptyWrapper: string
    inner: string
    emptyInner: string
    selected: string
    unselected: string
  },
) => {
  const wrapper = element.querySelector(":scope > .uesio-wrap")
  if (wrapper) {
    element.removeChild(wrapper)
  }
  element.classList.add(classes.wrapper)
  const selectArea = document.createElement("div")
  selectArea.style.display = "contents"
  selectArea.className = "uesio-wrap " + classes.theme
  const selectAreaInner = document.createElement("div")

  let isEmpty = true

  for (const child of element.childNodes) {
    if (child instanceof HTMLElement) {
      const pathAttr = child.getAttribute("data-path")
      // If we have a pathAttr, that means we've encountered a slot
      if (pathAttr) {
        if (child.childNodes.length) {
          isEmpty = false
          break
        }
        continue
      }
      isEmpty = false
      break
    }
    // it's a text node so we're not empty
    isEmpty = false
    break
  }

  isEmpty
    ? element.classList.add(classes.emptyWrapper)
    : element.classList.remove(classes.emptyWrapper)

  selectAreaInner.className = styles.cx(
    classes.inner,
    isEmpty && classes.emptyInner,
    isSelected ? classes.selected : classes.unselected,
  )
  if (isEmpty) {
    selectAreaInner.setAttribute("uesiolabel", componentType || "")
  }

  selectArea.appendChild(selectAreaInner)
  element.appendChild(selectArea)
}

const usePlaceHolders = (
  context: context.Context,
  path: string,
): [boolean, boolean, number] => {
  const dropPath = useDropPath(context)

  const viewDefId = context.getViewDefId()
  const fullPath = new FullPath("viewdef", viewDefId, path)

  const [, index, slotPath] = fullPath.popIndexAndType()

  let addBefore = false,
    addAfter = false

  if (dropPath.isSet() && dropPath.size() > 1) {
    const [dropIndex, dropSlotPath] = dropPath.popIndex()
    const isDroppingInMySlot = slotPath.equals(dropSlotPath)
    if (isDroppingInMySlot) {
      if (index === 0 && dropIndex === 0) addBefore = true
      if (dropIndex === index + 1) addAfter = true
    }
  }

  return [addBefore, addAfter, index]
}

const BuildWrapper: definition.UC = (props) => {
  const { children, path, context, componentType } = props

  const ref = useRef<HTMLDivElement | null>(null)

  const [addBefore, addAfter, index] = usePlaceHolders(context, path)

  const selectedComponentPath = useSelectedComponentPath(context).localPath

  const isSelected = path === selectedComponentPath

  const wrapperClass = styles.shortcut(
    context.removeAllThemeFrames(),
    "wrapper",
    StyleDefaults.wrapper,
  )

  const innerClass = styles.shortcut(
    context.removeAllThemeFrames(),
    "inner",
    StyleDefaults.inner,
  )

  const selectedClass = styles.shortcut(
    context,
    "selected",
    StyleDefaults.selected,
  )

  const unselectedClass = styles.shortcut(
    context,
    "unselected",
    StyleDefaults.unselected,
  )

  const emptyWrapperClass = styles.shortcut(
    context,
    "emptyWrapper",
    StyleDefaults.emptyWrapper,
  )
  const emptyInnerClass = styles.shortcut(
    context,
    "emptyInner",
    StyleDefaults.emptyInner,
  )

  useEffect(() => {
    // Loop over all my children
    if (!ref.current) return
    for (const child of ref.current.children) {
      if (child.getAttribute("data-placeholder") === "true") continue
      makeSelectBorder(child, isSelected, componentType, {
        wrapper: wrapperClass,
        theme: styles.getThemeClass(context),
        emptyWrapper: emptyWrapperClass,
        inner: innerClass,
        emptyInner: emptyInnerClass,
        selected: selectedClass,
        unselected: unselectedClass,
      })
    }
  })

  return (
    <div
      ref={ref}
      className={styles.process(context, StyleDefaults.root)}
      data-index={index}
      data-component={componentType}
      data-wrappertype="component"
    >
      {addBefore && (
        <PlaceHolder label="0" isHovering={true} context={context} />
      )}
      {children}
      {addAfter && (
        <PlaceHolder
          label={index + 1 + ""}
          isHovering={true}
          context={context}
        />
      )}
    </div>
  )
}

export { usePlaceHolders }

export default BuildWrapper
