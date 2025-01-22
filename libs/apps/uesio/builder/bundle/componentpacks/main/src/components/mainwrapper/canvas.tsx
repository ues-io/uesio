import {
  DragEvent,
  FormEvent,
  FunctionComponent,
  MouseEvent,
  useRef,
} from "react"
import { definition, styles, api, component } from "@uesio/ui"
import {
  useBuilderState,
  useDragPath,
  useDropPath,
  setSelectedPath,
  getSelectedComponentPath,
  setDropPath,
} from "../../api/stateapi"
import { FullPath } from "../../api/path"
import SelectBorder from "./selectborder"
import { getDragOverHandler, getDropHandler } from "../../helpers/dragdrop"
import { get } from "../../api/defapi"

const Canvas: FunctionComponent<definition.UtilityProps> = (props) => {
  const context = props.context

  const [dimensions] = useBuilderState<[number, number]>(context, "dimensions")

  const width = dimensions && dimensions[0]
  const height = dimensions && dimensions[1]

  const classes = styles.useUtilityStyleTokens(
    {
      root: ["overflow-hidden", "h-full", "relative", "bg-white"],

      scrollwrapper: ["h-full", "w-full"],

      outerwrapper: [
        "relative",
        "bg-white",
        `w-[${width ? width + "px" : "100%"}]`,
        `h-[${height ? height + "px" : "100%"}]`,
        "mx-auto",
        "transition-all",
      ],
      contentwrapper: [
        "overflow-auto",
        "h-full",
        "[container-type:size]",
        height && "border-y",
        width && "border-x",
        "border-dashed",
        "border-slate-300",
      ],
    },
    props,
  )

  const dragPath = useDragPath(context)
  const dropPath = useDropPath(context)

  const viewDefId = context.getViewDefId()
  const viewDef = api.view.useViewDef(viewDefId)
  const route = context.getRoute()

  const contentRef = useRef<HTMLDivElement>(null)

  if (!route || !viewDefId || !viewDef) return null

  const onChangeCapture = (e: FormEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  const onClickCapture = (e: MouseEvent) => {
    if (e.shiftKey) {
      return
    }
    e.stopPropagation()
    e.preventDefault()

    // Check for invisible target -- this is so that cypress testing can
    // trigger click events on zero width elements
    const eventTarget = e.target as Element
    let target: Element | null

    if (eventTarget.clientWidth === 0 || eventTarget.clientHeight === 0) {
      target = e.target as Element | null
    } else {
      // Step 1: Find the closest slot that is accepting the current dragpath.
      target = document.elementFromPoint(e.clientX, e.clientY)
    }

    if (!target) return
    let validPath = ""
    while (target !== null && target !== e.currentTarget) {
      const index = target.getAttribute("data-index") || ""
      target = target.parentElement
      if (!target) break
      const path = component.path.fromDataAttrPath(
        target.getAttribute("data-path"),
      )
      if (index && path) {
        validPath = `${path}["${index}"]`
        break
      }
    }

    if (validPath) {
      const pathToSelect = new FullPath("viewdef", viewDefId, validPath)
      const def = get(context, pathToSelect)
      setSelectedPath(context, getSelectedComponentPath(pathToSelect, def))
    }
  }

  const onDragLeave = (e: DragEvent) => {
    if (e.target === e.currentTarget) {
      setDropPath(context)
      return
    }
    const currentTarget = e.currentTarget as HTMLDivElement
    const bounds = currentTarget.getBoundingClientRect()
    const outsideLeft = e.pageX < bounds.left
    const outsideRight = e.pageX > bounds.right
    const outsideTop = e.pageY < bounds.top
    const outsideBottom = e.pageY > bounds.bottom
    if (outsideLeft || outsideRight || outsideTop || outsideBottom) {
      setDropPath(context)
    }
  }

  const onDrop = (e: DragEvent) => {
    getDropHandler(context, dragPath, dropPath)(e)
  }

  return (
    <div className={classes.root}>
      <div className={classes.scrollwrapper}>
        <div className={classes.outerwrapper} id="canvas-root">
          <div
            ref={contentRef}
            className={"uesio-theme " + classes.contentwrapper}
            onDragOver={getDragOverHandler(context, dragPath, dropPath)}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClickCapture={onClickCapture}
            onChangeCapture={onChangeCapture}
          >
            {props.children}
          </div>
          <SelectBorder viewdef={viewDef} context={context} />
        </div>
      </div>
      {/*<DebugPanel context={context} />*/}
    </div>
  )
}
Canvas.displayName = "Canvas"

export default Canvas
