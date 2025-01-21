import { api, definition, component, styles } from "@uesio/ui"

import { getBuilderNamespace } from "../../../api/stateapi"

const StyleDefaults = Object.freeze({
  root: ["flex", "gap-1"],
  crumbs: ["grow", "mr-1"],
  linkButton: ["h-8", "rounded", "text-slate-600", "px-2", "text-xs"],
})

const BuildBarHeader: definition.UtilityComponent = (props) => {
  const { context } = props
  const IOImage = component.getUtility("uesio/io.image")
  const IOGroup = component.getUtility("uesio/io.group")
  const IOButton = component.getUtility("uesio/io.button")
  const Avatar = component.getUtility("uesio/io.avatar")

  const viewKey = context.getViewDefId()

  const [viewNamespace, viewName] = component.path.parseKey(viewKey || "")

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const workspace = context.getWorkspace()
  if (!workspace) throw new Error("No Workspace Context Provided")
  const nsInfo = getBuilderNamespace(context, workspace.app)

  const [homeLogoLink, homeLogoOnClick] = api.signal.useLinkHandler(
    [
      {
        // Have to use REDIRECT in order for path to be resolved to top-level "/home"
        // and because we are switching in/out of workspace / site mode,
        // otherwise the resolved URL will be /workspace/...lots of stuff.../home which is NOT what we want
        signal: "route/REDIRECT",
        path: "/home",
      },
    ],
    context,
  )

  return (
    <div className={classes.root}>
      <IOImage
        height="32"
        width="32"
        variant="uesio/appkit.uesio_logo"
        file="uesio/core.logowhite"
        context={context}
        onClick={homeLogoOnClick}
        link={homeLogoLink}
      />
      <IOGroup
        context={context}
        variant="uesio/appkit.breadcrumbs"
        className={classes.crumbs}
      >
        <IOButton
          iconText={nsInfo?.icon}
          onClick={() => {
            api.signal.run(
              {
                signal: "route/NAVIGATE",
                path: `/app/${workspace.app}`,
                namespace: "uesio/studio",
              },
              context.deleteWorkspace(),
            )
          }}
          link={`/app/${workspace.app}`}
          classes={{ root: classes.linkButton }}
          styleTokens={{
            root: [`text-[${nsInfo?.color}]`],
          }}
          context={context}
        />
        <component.Component
          componentType={"uesio/appkit.icontile"}
          path=""
          definition={{
            icon: "handyman",
            tileVariant: "uesio/appkit.breadcrumb",
            signals: [
              {
                signal: "route/NAVIGATE",
                path: `/app/${workspace.app}/workspace/${workspace.name}`,
                namespace: "uesio/studio",
              },
            ],
            ["uesio.styleTokens"]: {
              root: ["ml-2.5"],
            },
          }}
          context={context.deleteWorkspace()}
        />
        <component.Component
          componentType={"uesio/appkit.icontile"}
          path=""
          definition={{
            icon: "view_quilt",
            tileVariant: "uesio/appkit.breadcrumb",
            signals: [
              {
                signal: "route/NAVIGATE",
                path: `/app/${workspace.app}/workspace/${workspace.name}/views`,
                namespace: "uesio/studio",
              },
            ],
            ["uesio.styleTokens"]: {
              root: ["ml-1.5"],
            },
          }}
          context={context.deleteWorkspace()}
        />
        <component.Component
          componentType={"uesio/appkit.icontile"}
          path=""
          definition={{
            title: viewName,
            tileVariant: "uesio/appkit.breadcrumb",
            signals: [
              {
                signal: "route/NAVIGATE",
                path: `/app/${workspace.app}/workspace/${workspace.name}/views/${viewNamespace}/${viewName}`,
                namespace: "uesio/studio",
              },
            ],
            ["uesio.styleTokens"]: {
              root: ["ml-1.5", "max-w-[80px]"],
              title: ["overflow-hidden", "[text-overflow:ellipsis]"],
            },
          }}
          context={context.deleteWorkspace()}
        />
      </IOGroup>
      <Avatar image="$User{picture}" text="$User{initials}" context={context} />
    </div>
  )
}

export default BuildBarHeader
