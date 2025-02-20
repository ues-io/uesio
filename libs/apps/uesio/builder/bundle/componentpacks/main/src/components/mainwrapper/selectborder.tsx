import { definition, component, styles, context } from "@uesio/ui"
import {
  useSelectedComponentPath,
  setDragPath,
  getComponentDef,
  getBuilderNamespaces,
  useDragPath,
  setSelectedPath,
} from "../../api/stateapi"

import { createPortal } from "react-dom"
import { FullPath } from "../../api/path"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import CloneAction from "../../actions/cloneaction"
import { useEffect, useRef } from "react"

const StyleDefaults = Object.freeze({
  header: [
    "bg-white",
    "flex",
    "items-center",
    "text-xxs",
    "m-0.5",
    "gap-1",
    "p-1.5",
    "rounded-sm",
    "font-light",
    "uppercase",
    "leading-none",
    "cursor-grab",
  ],
  titletext: ["grow"],
  actionarea: ["text-white"],
  closebutton: ["text-slate-700", "p-0", "m-0"],
  arrow: ["fill-accent"],
  popper: ["bg-accent", "rounded"],
})

const selectedClasses = ["relative"]

const selectBorderClasses = [
  "absolute",
  "inset-0",
  "pointer-events-none",
  "outline",
  "outline-8",
  "outline-accent-600/40",
  "-outline-offset-[8px]",
  "z-10",
]

const nonComponentPaths = ["wires", "params"]

const getComponentInfoFromPath = (path: FullPath, context: context.Context) => {
  const isValid =
    path.isSet() &&
    path.itemType === "viewdef" &&
    path.itemName === context.getViewDefId() &&
    path.localPath &&
    path.size() > 1 &&
    !nonComponentPaths.includes(path.trimToSize(1).pop()[0] as string)
  if (!isValid) {
    return [undefined, undefined, undefined, undefined] as const
  }
  const [componentType, parentPath] = path.pop()
  const [componentIndex, grandParentPath] = parentPath.popIndex()
  const componentDef = getComponentDef(componentType)
  return [componentIndex, parentPath, grandParentPath, componentDef] as const
}

const getTargetsFromSlotIndex = (
  localPath: string,
  index: number | undefined,
) => {
  const targets: Element[] = []
  if (!localPath || index === undefined) return targets
  const targetWrappers = document.querySelectorAll(
    `[data-path="${CSS.escape(
      component.path.toDataAttrPath(localPath),
    )}"]>[data-index="${index}"]`,
  )

  targetWrappers.forEach((target) => {
    const children = target.querySelectorAll(":scope>:not([data-placeholder])")
    if (children.length) {
      children.forEach((child) => {
        targets.push(child)
      })
      return null
    }
    targets.push(target)
  })
  return targets
}

type Props = {
  viewdef: definition.DefinitionMap
}

const SelectBorder: definition.UtilityComponent<Props> = (props) => {
  const context = props.context

  const Popper = component.getUtility("uesio/io.popper")
  const IconButton = component.getUtility("uesio/io.iconbutton")
  const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const selectedStyle = styles.shortcut(
    context.removeAllThemeFrames(),
    "selected",
    selectedClasses,
  )

  const selectBorderStyle = styles.shortcut(
    context,
    "selected",
    selectBorderClasses,
  )

  const selectedComponentPath = useSelectedComponentPath(context)

  const prevSelectedChildren = useRef<Element[]>()

  const dragPath = useDragPath(context)
  const isDragging = dragPath.isSet()

  const [
    selectedChildIndex,
    selectedParentPath,
    selectedSlotPath,
    selectedComponentDef,
  ] = getComponentInfoFromPath(selectedComponentPath, context)

  const selectedLocalPath = selectedSlotPath?.localPath || ""

  const selectedChildren = getTargetsFromSlotIndex(
    selectedLocalPath,
    selectedChildIndex,
  )

  useEffect(() => {
    prevSelectedChildren.current?.forEach((child) => {
      selectedStyle.split(" ").forEach((s) => {
        child.classList.remove(s)
      })
    })
    prevSelectedChildren.current = selectedChildren
    if (!selectedChildren) return
    selectedChildren.forEach((target) => {
      selectedStyle.split(" ").forEach((s) => {
        target.classList.add(s)
      })
    })
  })

  /*
	useEffect(() => {
		// Selected component handling
		if (!selectedLocalPath || isDragging) {
			setSelectedChildren([])
			return
		}
		setSelectedChildren(
			getTargetsFromSlotIndex(selectedLocalPath, selectedChildIndex)
		)
	}, [isDragging, selectedLocalPath, selectedChildIndex, classes.selected])
	*/

  if (!selectedChildren || !selectedParentPath || !selectedComponentDef)
    return null

  const nsInfo = getBuilderNamespaces(context)[selectedComponentDef.namespace]
  const componentTitle = selectedComponentDef.title || selectedComponentDef.name

  if (isDragging || !selectedChildren.length) return null

  return (
    <>
      {selectedChildren.map((selectedChild) =>
        createPortal(
          <div
            className={styles.getThemeClass(context)}
            style={{ display: "contents" }}
          >
            <div className={selectBorderStyle} />
          </div>,
          selectedChild,
        ),
      )}
      <Popper
        referenceEl={selectedChildren[0]}
        context={context}
        placement="top"
        offset={8}
        arrow={true}
        classes={classes}
        portalId="canvas-root"
      >
        <div>
          <div
            className={classes.header}
            draggable
            onDragStart={() => {
              setTimeout(() => {
                setDragPath(context, selectedComponentPath)
              })
            }}
            onDragEnd={() => {
              setDragPath(context)
            }}
          >
            <NamespaceLabel
              metadatakey={selectedComponentDef.namespace}
              metadatainfo={nsInfo}
              title={componentTitle}
              context={context}
              classes={{
                root: classes.titletext,
              }}
            />
            <IconButton
              context={context}
              variant="uesio/builder.buildtitle"
              className={classes.closebutton}
              icon="close"
              onClick={() => setSelectedPath(context)}
            />
          </div>
          <div className={classes.actionarea}>
            <DeleteAction context={context} path={selectedParentPath} />
            <MoveActions context={context} path={selectedParentPath} />
            <CloneAction
              context={context}
              path={selectedParentPath}
              purgeProperties={[component.COMPONENT_ID]}
            />
          </div>
        </div>
      </Popper>
    </>
  )
}

export default SelectBorder
