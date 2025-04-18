import { definition, hooks, component, api, styles } from "@uesio/ui"
import Canvas from "./canvas"
import {
  useBuildMode,
  useBuilderState,
  getBuilderComponentId,
  useBuildDepsLoaded,
} from "../../api/stateapi"
import PropertiesPanel from "./propertiespanel/propertiespanel"
import ViewInfoPanel from "./viewinfopanel/viewinfopanel"
import IndexPanel from "./indexpanel"
import ChatPanel from "./chatpanel"
import { SlotBuilderComponentId } from "../../utilities/slotbuilder/slotbuilder"
import CodePanel from "./codepanel"
import { toggleBuildMode } from "../../helpers/buildmode"
import BuildBar from "./buildbar/buildbar"
import { ReactNode } from "react"
import AdjustableHeightArea from "../../utilities/adjustableheightarea/adjustableheightarea"
import {
  getSelectedContentDispatcher,
  handleEditsDispatcher,
} from "./editortool"

const StyleDefaults = Object.freeze({
  root: ["h-full", "grid-cols-[1fr]", "auto-cols-auto", "grid-rows-[100%]"],
  leftpanel: [
    "col-end-[-3]",
    "grid-rows-[1fr_1fr]",
    "gap-2",
    "border-r-8",
    "border-panel_divider_color",
    "bg-panel_divider_color",
  ],
  leftpanel2: ["col-end-[-2]", "border-r-8", "border-panel_divider_color"],
  rightpanel: ["col-end-3", "border-l-8", "border-panel_divider_color"],
  canvaswrap: ["grid-rows-1", "auto-rows-auto", "col-end-[-1]"],
  canvaswrapinner: ["relative", "grid", "grid-rows-1", "grid-cols-1"],
})

type ThemeWrapperProps = {
  themeClass: string
  children?: ReactNode
}

const ThemeWrapper = (props: ThemeWrapperProps) => (
  <div
    className={props.themeClass}
    style={{
      display: "contents",
    }}
  >
    {props.children}
  </div>
)

const MainWrapper: definition.UC<component.ViewComponentDefinition> = (
  props,
) => {
  const { context, definition, path } = props
  const Grid = component.getUtility("uesio/io.grid")

  const [buildMode, setBuildMode] = useBuildMode(context)
  const [buildDepsLoaded, setBuildDepsLoaded] = useBuildDepsLoaded(
    context,
    !!buildMode,
  )

  // Add a view frame to our builder context so that our component ids work right
  const builderContext = context
    .addThemeFrame("uesio/builder.default")
    .addViewFrame({
      view: context.getViewId(),
      viewDef: context.getViewDefId() || "",
    })

  const themeClass = styles.setupStyles(builderContext)
  const canvasContext = context.setCustomSlotLoader(SlotBuilderComponentId)

  const classes = styles.useStyleTokens(StyleDefaults, {
    ...props,
    context: builderContext,
  })

  hooks.useHotKeyCallback(
    "meta+u",
    () => {
      toggleBuildMode(
        builderContext,
        setBuildMode,
        setBuildDepsLoaded,
        !!buildMode,
        !!buildDepsLoaded,
      )
    },
    true,
    [buildMode, setBuildMode],
  )

  hooks.useHotKeyCallback("meta+p", () => {
    const workspace = context.getWorkspace()
    const route = context.getRoute()
    if (!workspace || !route) {
      throw new Error("Not in a Workspace Context")
    }
    const [viewNamespace, viewName] = component.path.parseKey(route.view)
    api.signal.run(
      {
        signal: "route/NAVIGATE",
        path: `/app/${workspace.app}/workspace/${workspace.name}/views/${viewNamespace}/${viewName}`,
        namespace: "uesio/studio",
      },
      context.deleteWorkspace(),
    )
  })

  const [showCode] = useBuilderState<boolean>(context, "codepanel")
  const [showIndex] = useBuilderState<boolean>(context, "indexpanel")
  const [showChat] = useBuilderState<boolean>(context, "chatpanel")

  const hasChatFeature =
    context.getFeatureFlag("uesio/studio.chat_panel")?.value === true

  if (!buildMode) {
    return (
      <>
        <component.ViewArea
          context={context}
          definition={definition}
          path={path}
        />
        <ThemeWrapper themeClass={themeClass}>
          <BuildBar context={builderContext} />
        </ThemeWrapper>
      </>
    )
  }

  return (
    <ThemeWrapper themeClass={themeClass}>
      <Grid className={classes.root} context={context} id="builder-root">
        <Grid context={context} className={classes.leftpanel}>
          <PropertiesPanel context={builderContext} />
          <ViewInfoPanel context={builderContext} />
        </Grid>
        {showIndex && (
          <Grid context={context} className={classes.leftpanel2}>
            <IndexPanel context={builderContext} />
          </Grid>
        )}
        <Grid className={classes.canvaswrap} context={builderContext}>
          <div className={classes.canvaswrapinner}>
            <Canvas context={builderContext}>
              <component.ViewArea
                context={canvasContext}
                definition={definition}
                path={path}
              />
            </Canvas>
            <BuildBar context={builderContext} />
          </div>
          {showCode && (
            <AdjustableHeightArea
              componentId={getBuilderComponentId(context, "code_panel_height")}
              context={builderContext}
            >
              <CodePanel context={builderContext} />
            </AdjustableHeightArea>
          )}
        </Grid>
        {showChat && hasChatFeature && (
          <Grid context={context} className={classes.rightpanel}>
            <ChatPanel context={builderContext.deleteWorkspace()} />
          </Grid>
        )}
      </Grid>
    </ThemeWrapper>
  )
}

MainWrapper.signals = {
  TOGGLE_CODE: {
    dispatcher: (state) => !state,
    target: "codepanel",
  },
  TOGGLE_INDEX: {
    dispatcher: (state) => !state,
    target: "indexpanel",
  },
  TOGGLE_CHAT: {
    dispatcher: (state) => !state,
    target: "chatpanel",
  },
  SET_DIMENSIONS: {
    dispatcher: (state, payload) => [payload.width, payload.height],
    target: "dimensions",
  },
  GET_SELECTED_CONTENT: {
    dispatcher: getSelectedContentDispatcher,
  },
  HANDLE_EDITS: {
    dispatcher: handleEditsDispatcher,
  },
}

export default MainWrapper
