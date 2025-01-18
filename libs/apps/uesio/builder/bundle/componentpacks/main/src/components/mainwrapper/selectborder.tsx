import { definition, component, styles, context } from "@uesio/ui"
import {
  useSelectedComponentPath,
  setDragPath,
  getComponentDef,
  getBuilderNamespaces,
  useDragPath,
  setSelectedPath,
} from "../../api/stateapi"
import { useEffect, useRef } from "react"
import { FullPath } from "../../api/path"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import CloneAction from "../../actions/cloneaction"

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

const selectedClasses = [
  "after:absolute",
  "after:inset-0",
  "after:pointer-events-none",
  "after:outline",
  "after:outline-8",
  "after:outline-accent-600/40",
  "after:-outline-offset-[8px]",
  "after:z-10",
  "empty:block",
  "relative",
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

  const selectedStyle = styles.shortcut("selected", selectedClasses)

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
      child.classList.remove(selectedStyle)
    })
    prevSelectedChildren.current = selectedChildren
    if (!selectedChildren) return
    selectedChildren.forEach((target) => {
      target.classList.add(selectedStyle)
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

  return !isDragging && selectedChildren.length ? (
    <Popper
      referenceEl={selectedChildren[0]}
      context={context}
      placement="top"
      offset={8}
      arrow={true}
      classes={classes}
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
  ) : null
}

export default SelectBorder
