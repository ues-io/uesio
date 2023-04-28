import { definition, hooks, component, api, styles } from "@uesio/ui"
import Canvas from "./canvas"
import { useBuilderState, useBuildMode } from "../../api/stateapi"
import BuildArea from "./buildarea"
import CodePanel from "./codepanel"
import AdjustableWidthArea from "../../utilities/adjustablewidtharea/adjustablewidtharea"
import PropertiesPanel from "./propertiespanel/propertiespanel"
import ViewInfoPanel from "./viewinfopanel/viewinfopanel"
import MainHeader from "./mainheader"

const MainWrapper: definition.UC = (props) => {
	const { context } = props
	const Grid = component.getUtility("uesio/io.grid")
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")

	const [buildMode, setBuildMode] = useBuildMode(context)

	const builderContext = context.addThemeFrame("uesio/studio.default")

	const classes = styles.useStyleTokens(
		{
			root: ["bg-slate-50", "p-2"],
			configarea: ["auto-rows-fr", "gap-2"],
		},
		props
	)

	hooks.useHotKeyCallback(
		"meta+u",
		() => {
			api.builder.getBuilderDeps(context).then(() => {
				setBuildMode(!buildMode)
			})
		},
		true,
		[buildMode]
	)

	hooks.useHotKeyCallback("meta+p", () => {
		api.signal.run({ signal: "route/REDIRECT_TO_VIEW_CONFIG" }, context)
	})

	const [showCode] = useBuilderState<boolean>(props.context, "codepanel")

	if (!buildMode) {
		return <>{props.children}</>
	}

	return (
		<ScrollPanel
			variant="uesio/io.default"
			context={context}
			header={<MainHeader context={builderContext} />}
		>
			<BuildArea
				className={classes.root}
				config={
					<Grid context={context} className={classes.configarea}>
						<PropertiesPanel context={builderContext} />
						<ViewInfoPanel context={builderContext} />
					</Grid>
				}
				code={
					showCode && (
						<AdjustableWidthArea context={context}>
							<CodePanel context={builderContext} />
						</AdjustableWidthArea>
					)
				}
				showCode={showCode}
				context={context}
			>
				<Canvas context={context} children={props.children} />
			</BuildArea>
		</ScrollPanel>
	)
}

MainWrapper.signals = {
	TOGGLE_CODE: {
		dispatcher: (state) => !state,
		target: "codepanel",
	},
	SET_DIMENSIONS: {
		dispatcher: (state, payload) => [payload.width, payload.height],
		target: "dimensions",
	},
}

export default MainWrapper
