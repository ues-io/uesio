import { definition, styles } from "@uesio/ui"
import BuildBarHeader from "./buildbar_header"
import BuildBarMainButtons from "./buildbar_main_buttons"
import BuildBarHandle from "./buildbar_handle"
import BuildBarTools from "./buildbar_tools"

const SHADOWS = Object.freeze([
  "0 0px 3px 0 rgb(0 0 0 / 0.1)",
  "0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "0 4px 6px -1px rgb(0 0 0 / 0.1)",
])

const StyleDefaults = Object.freeze({
  root: [
    "absolute",
    "p-2",
    "right-0",
    "bottom-0",
    "z-30",
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

  return (
    <div className={classes.root}>
      <div>
        <BuildBarHeader context={context} />
        <BuildBarMainButtons context={context} />
      </div>
      <BuildBarHandle context={context} />
      <BuildBarTools context={context} />
    </div>
  )
}

export default BuildBar
