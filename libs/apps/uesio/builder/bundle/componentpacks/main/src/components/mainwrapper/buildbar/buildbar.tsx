import { definition, styles } from "@uesio/ui"
import BuildBarHeader from "./buildbar_header"
import BuildBarMainButtons from "./buildbar_main_buttons"
import BuildBarHandle from "./buildbar_handle"
import BuildBarTools from "./buildbar_tools"
import { useRef } from "react"
import BuildBarDraggable from "./buildbar_draggable"

const SHADOWS = Object.freeze([
  "0 0px 3px 0 rgb(0 0 0 / 0.1)",
  "0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "0 4px 6px -1px rgb(0 0 0 / 0.1)",
])

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

  const handleRef = useRef<HTMLDivElement>(null)

  return (
    <BuildBarDraggable context={context} handleRef={handleRef}>
      <div className={classes.root}>
        <div>
          <BuildBarHeader context={context} />
          <BuildBarMainButtons context={context} />
        </div>
        <div ref={handleRef}>
          <BuildBarHandle context={context} />
        </div>
        <BuildBarTools context={context} />
      </div>
    </BuildBarDraggable>
  )
}

export default BuildBar
