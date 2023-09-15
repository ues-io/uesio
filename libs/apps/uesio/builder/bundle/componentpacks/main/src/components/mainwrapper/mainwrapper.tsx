import { definition, hooks, component, api, styles } from "@uesio/ui"
import Canvas from "./canvas"
import { useBuilderState, useBuildMode } from "../../api/stateapi"
import CodePanel from "./codepanel"
import AdjustableWidthArea from "../../utilities/adjustablewidtharea/adjustablewidtharea"
import PropertiesPanel from "./propertiespanel/propertiespanel"
import ViewInfoPanel from "./viewinfopanel/viewinfopanel"
import MainHeader from "./mainheader"
import RightToolbar from "./righttoolbar"
import IndexPanel from "./indexpanel"
import { SlotBuilderComponentId } from "../../utilities/slotbuilder/slotbuilder"

const StyleDefaults = Object.freeze({
	root: [
		"bg-slate-50",
		"p-2",
		"gap-2",
		"h-full",
		"grid-cols-[auto_1fr]",
		"auto-cols-auto",
		"grid-rows-[100%]",
	],
	configarea: ["auto-rows-fr", "gap-2"],
})

const MainWrapper: definition.UC<component.ViewComponentDefinition> = (
	props
) => {
	const { context, definition, path } = props
	const Grid = component.getUtility("uesio/io.grid")
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")

	const [buildMode, setBuildMode] = useBuildMode(context)

	const builderContext = context.addThemeFrame("uesio/studio.default")
	const canvasContext = context.setCustomSlotLoader(SlotBuilderComponentId)

	const classes = styles.useStyleTokens(StyleDefaults, props)

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
	const [showIndex] = useBuilderState<boolean>(props.context, "indexpanel")

	if (!buildMode) {
		return (
			<>
				<component.ViewArea
					context={context}
					definition={definition}
					path={path}
				/>
			</>
		)
	}

	const indexPanelIndex = 3
	const codePanelIndex = indexPanelIndex + (showIndex ? 1 : 0)
	const rightPanelIndex = codePanelIndex + (showCode ? 1 : 0)

	return (
		<ScrollPanel
			variant="uesio/io.default"
			context={context}
			header={<MainHeader context={builderContext} />}
		>
			<Grid className={classes.root} context={context}>
				<Grid context={context} className={classes.configarea}>
					<PropertiesPanel context={builderContext} />
					<ViewInfoPanel context={builderContext} />
				</Grid>
				<Canvas context={canvasContext}>
					<component.ViewArea
						context={canvasContext}
						definition={definition}
						path={path}
					/>
				</Canvas>
				{showIndex && (
					<AdjustableWidthArea
						className={`col-start-${indexPanelIndex}`}
						context={context}
					>
						<IndexPanel context={builderContext} />
					</AdjustableWidthArea>
				)}
				{showCode && (
					<AdjustableWidthArea
						className={`col-start-${codePanelIndex}`}
						context={context}
					>
						<CodePanel context={builderContext} />
					</AdjustableWidthArea>
				)}
				<RightToolbar
					className={`col-start-${rightPanelIndex}`}
					context={context}
				/>
			</Grid>
		</ScrollPanel>
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
	TOGGLE_SLOT_TAGS: {
		dispatcher: (state) => !state,
		target: "slottags",
	},
	SET_DIMENSIONS: {
		dispatcher: (state, payload) => [payload.width, payload.height],
		target: "dimensions",
	},
}

export default MainWrapper
