import { FC, useRef } from "react"
import { definition, component, hooks, context as ctx, styles } from "@uesio/ui"
import Canvas from "../../shared/canvas"
import TopLeftNav from "../../shared/topleftnav"
import BottomLeftNav from "../../shared/bottomleftnav"
import RightNav from "../../shared/rightnav"
import PropertiesPanel from "../../shared/propertiespanel"
import WiresPanel from "../../shared/wirespanel"
import CodePanel from "../../shared/codepanel"
import { BuilderState } from "./runtimebuilderdefinition"
import ComponentsPanel from "../../shared/componentspanel"

const Grid = component.registry.getUtility("io.grid")
import usePanels from "./usePanels"

component.registry.registerSignals("uesio.runtime", {
	TOGGLE_CODE: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as BuilderState
			setState({
				...state,
				showCode: !state.showCode,
			})
		},
		target: "panels",
	},
	SHOW_COMPS: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as BuilderState
			setState({
				...state,
				showComps: true,
				showWires: false,
			})
		},
		target: "panels",
	},
	SHOW_WIRES: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as BuilderState
			setState({
				...state,
				showComps: false,
				showWires: true,
			})
		},
		target: "panels",
	},
})

const NAV_WIDTH = 50
const LEFT_PANEL_WIDTH = 300

const Buildtime: FC<definition.BaseProps> = (props) => {
	const slideRef = useRef<HTMLDivElement>(null)
	const [setDragging, codePanelWidth] = usePanels(slideRef.current)
	const uesio = hooks.useUesio(props)

	const [state] = uesio.component.useState<BuilderState>("panels", {
		showCode: false,
		showComps: true,
		showWires: false,
	})

	const { context } = props

	// This can be removed when we figure out a better way to get all variants onto the page for buildtime
	// Right now we need this so we can re-render when we get the view definition in.
	const def = uesio.builder.useDefinition(
		component.path.makeFullPath("viewdef", context.getViewDefId() || "", "")
	)

	const viewDef = context.getViewDef()

	const scriptResult = uesio.component.usePacks(
		Object.keys(viewDef?.dependencies?.componentpacks || {}),
		true
	)

	const builderTheme = uesio.theme.useTheme(
		"studio.default",
		new ctx.Context()
	)
	if (!scriptResult.loaded || !def || !builderTheme || !state)
		return <Canvas context={context} />

	const builderContext = context.addFrame({
		theme: "studio.default",
	})
	const canvasContext = context.addFrame({
		mediaOffset:
			NAV_WIDTH * 2 +
			(state.showComps || state.showWires ? LEFT_PANEL_WIDTH : 0) +
			(state.showCode ? codePanelWidth : 0),
	})

	return (
		<Grid
			context={context}
			styles={{
				root: {
					height: "100vh",
					gridTemplateColumns: `${NAV_WIDTH}px ${LEFT_PANEL_WIDTH}px 1fr ${codePanelWidth}px ${NAV_WIDTH}px`,
					gridTemplateRows: "1fr 1fr",
				},
			}}
		>
			<TopLeftNav
				context={builderContext}
				className={styles.css({ gridRow: 1, gridColumn: 1 })}
			/>
			<BottomLeftNav
				context={builderContext}
				className={styles.css({ gridRow: 2, gridColumn: 1 })}
			/>
			<PropertiesPanel
				context={builderContext}
				className={styles.css({ gridRow: 1, gridColumn: 2 })}
			/>
			{state.showWires && (
				<WiresPanel
					context={builderContext}
					className={styles.css({ gridRow: 2, gridColumn: 2 })}
				/>
			)}
			{state.showComps && (
				<ComponentsPanel
					context={builderContext}
					className={styles.css({ gridRow: 2, gridColumn: 2 })}
				/>
			)}
			<Canvas
				className={styles.css({
					gridRow: "1 / 3",
					gridColumn: state.showCode ? "3" : "3 / 5",
				})}
				context={canvasContext}
			/>
			{state.showCode && (
				<div
					ref={slideRef}
					className={styles.css({
						gridRow: "1 / 3",
						gridColumn: 4,
						position: "relative",
					})}
				>
					{/* Whole box, from top to down that is slidable */}
					<div
						role="seperator"
						aria-valuenow={0}
						onMouseDown={() => setDragging(true)}
						className={styles.css({
							display: "flex",
							alignItems: "center",
							cursor: "ew-resize",
							width: "10px",
							position: "absolute",
							left: "-3px",
							top: 0,
							height: "100%",
							zIndex: 1,

							"&:hover span, &:active span": {
								opacity: 1,
								cursor: "ew-resize",
							},
						})}
					>
						{/* Visual indicator */}
						<span
							className={styles.css({
								backgroundColor: "rgb(255, 94, 47)",
								width: "4px",
								height: "8em",
								borderRadius: "6px",
								transform: "translateX(-50%)",
								opacity: 0.5,
								cursor: "ew-resize",
								maxHeight: "6em",
								transition: "all 0.125s ease",
								position: "absolute",
							})}
						/>
					</div>
					<CodePanel
						className={styles.css({
							position: "relative",
							boxShadow: "0 0 19px -6px rgb(0 0 0 / 20%)",
						})}
						context={builderContext}
					/>
				</div>
			)}

			<RightNav
				context={builderContext}
				className={styles.css({ gridRow: "1 / 3", gridColumn: 5 })}
			/>
		</Grid>
	)
}

export default Buildtime
