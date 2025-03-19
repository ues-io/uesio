import { signal, component, api, metadata, definition, styles } from "@uesio/ui"
import TabLabels from "../../utilities/tablabels/tablabels"
import { useEffect } from "react"
import ScrollPanel from "../../utilities/scrollpanel/scrollpanel"

export type TabDefinition = {
  id: string
  label: string
  icon?: string
  components: definition.DefinitionList
  "uesio.display"?: component.DisplayCondition[]
}

type TabsDefinition = {
  tabs?: TabDefinition[]
  panelVariant?: metadata.MetadataKey
  labelsVariant?: metadata.MetadataKey
}

interface SelectTabSignal extends signal.SignalDefinition {
  id: string
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
  SELECT_TAB: {
    dispatcher: (_, signal: SelectTabSignal) => signal.id,
  },
}

const StyleDefaults = Object.freeze({
  root: [],
  labels: [],
  panel: [],
})

const Tabs: definition.UC<TabsDefinition> = (props) => {
  const { definition, context, path, componentType } = props
  const { tabs = [] } = definition
  const classes = styles.useStyleTokens(StyleDefaults, props)

  const componentId = api.component.getComponentIdFromProps(props)

  const [selectedTabId, setSelectedTab] =
    api.component.useState<string>(componentId)
  const foundIndex = tabs.findIndex((tab) => tab.id === selectedTabId)
  const selectedIndex = foundIndex === -1 ? 0 : foundIndex
  const selectedTab = tabs[selectedIndex]
  const allVisibleTabs = component.useShouldFilter(tabs, context)
  const shouldDisplaySelectedTab =
    allVisibleTabs.findIndex((tab) => tab.id === selectedTab.id) > -1
  useEffect(() => {
    if (!shouldDisplaySelectedTab) {
      setSelectedTab(allVisibleTabs[0]?.id)
    }
  }, [
    selectedTabId,
    shouldDisplaySelectedTab,
    tabs,
    setSelectedTab,
    allVisibleTabs,
  ])

  return (
    <ScrollPanel
      className={styles.cx("selected-index-" + selectedIndex, classes.root)}
      context={context}
      variant={definition.panelVariant}
      header={
        <TabLabels
          variant={definition.labelsVariant}
          selectedTab={selectedTab?.id}
          setSelectedTab={setSelectedTab}
          tabs={tabs}
          className={classes.labels}
          context={context}
        />
      }
    >
      {shouldDisplaySelectedTab && (
        <component.Slot
          definition={selectedTab}
          listName="components"
          path={`${path}["tabs"]["${selectedIndex}"]`}
          context={context}
          componentType={componentType}
          className={classes.panel}
        />
      )}
    </ScrollPanel>
  )
}

Tabs.signals = signals
export default Tabs
