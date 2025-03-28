import { definition, component, api, styles } from "@uesio/ui"

const StyleDefaults = Object.freeze({
  root: ["w-[300px]"],
  index: ["px-2", "py-1"],
})

const ChatPanel: definition.UtilityComponent = (props) => {
  const { context } = props
  const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
  const TitleBar = component.getUtility("uesio/io.titlebar")
  const IconButton = component.getUtility("uesio/io.iconbutton")
  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  return (
    <ScrollPanel
      variant="uesio/builder.mainsection"
      header={
        <TitleBar
          variant="uesio/builder.primary"
          title={"AI Chat"}
          actions={
            <IconButton
              context={context}
              variant="uesio/builder.buildtitle"
              icon="close"
              onClick={api.signal.getHandler(
                [
                  {
                    signal: "component/CALL",
                    component: "uesio/builder.mainwrapper",
                    componentsignal: "TOGGLE_CHAT",
                  },
                ],
                context.getRouteContext(),
              )}
            />
          }
          context={context}
        />
      }
      context={context}
      className={classes.root}
    >
      <component.Component
        componentType="uesio/io.emptystate"
        definition={{
          title: "Not Implemented yet.",
          subtitle: "The AI Chat feature is coming soon.",
          icon: "construction",
        }}
        path={""}
        context={context}
      />
    </ScrollPanel>
  )
}

export default ChatPanel
