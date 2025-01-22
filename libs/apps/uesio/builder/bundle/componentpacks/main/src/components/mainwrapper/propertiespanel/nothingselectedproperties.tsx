import { definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import { setSelectedPath, useSelectedPath } from "../../../api/stateapi"

const NothingSelectedProperties: definition.UtilityComponent = (props) => {
  const { context } = props

  const selectedPath = useSelectedPath(context)

  return (
    <PropertiesWrapper
      context={props.context}
      className={props.className}
      path={selectedPath}
      title={"Nothing Selected"}
      onUnselect={() => setSelectedPath(context)}
    />
  )
}

NothingSelectedProperties.displayName = "NothingSelectedProperties"

export default NothingSelectedProperties
