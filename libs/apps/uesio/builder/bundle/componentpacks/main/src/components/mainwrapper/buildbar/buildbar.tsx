import { definition, styles } from "@uesio/ui"
import BuildBarHeader from "./buildbar_header"
import BuildBarMainButtons from "./buildbar_main_buttons"
import BuildBarHandle from "./buildbar_handle"
import BuildBarTools, { SHADOWS } from "./buildbar_tools"
import { useRef } from "react"
import BuildBarDraggable from "./buildbar_draggable"

const StyleDefaults = Object.freeze({
  root: [
    "p-2",
    "m-3",
    `shadow-[${SHADOWS.join(",").split(" ").join("_")}]`,
    "bg-white",
    "rounded-md",
    "flex",
    "gap-2",
  ],
})

const BuildBar: definition.UtilityComponent = (props) => {
  const { context } = props

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const rootRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  return (
    <BuildBarDraggable
      context={context}
      rootRef={wrapperRef}
      handleRef={handleRef}
    >
      <div ref={rootRef} className={classes.root}>
        <div>
          <BuildBarHeader context={context} />
          <BuildBarMainButtons context={context} />
        </div>
        <div ref={handleRef}>
          <BuildBarHandle context={context} />
        </div>
        <BuildBarTools context={context} rootRef={rootRef} />
      </div>
    </BuildBarDraggable>
  )
}

export default BuildBar

export { SHADOWS }
