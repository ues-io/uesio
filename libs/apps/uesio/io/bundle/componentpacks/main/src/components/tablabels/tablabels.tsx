import { component, definition, api, styles } from "@uesio/ui"
import { useState } from "react"
import IOTabLabels from "../../utilities/tablabels/tablabels"
import { TabDefinition } from "../tabs/tabs"

type TabLabelsDefinition = {
  tabs: definition.DefinitionList
}

const StyleDefaults = Object.freeze({
  root: [],
})

// This component is not used or exposed anywhere currently,
// it just exists to enable us to have a utility component that uses the tablabels variant.
// TODO: Remove this component once we have a better way to do this.
const TabLabels: definition.UC<TabLabelsDefinition> = (props) => {
  const { definition, context } = props
  const classes = styles.useStyleTokens(StyleDefaults, props)
  const [selectedTab, setSelectedTab] = useState<string>("")
  return (
    <IOTabLabels
      id={api.component.getComponentIdFromProps(props)}
      variant={definition[component.STYLE_VARIANT]}
      context={context}
      classes={classes}
      tabs={definition.tabs as TabDefinition[]}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
    />
  )
}

export default TabLabels
