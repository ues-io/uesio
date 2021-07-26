import { FC, useState, useEffect, useRef, useCallback } from "react"
import _ from "lodash"

import { definition, component, hooks, context as ctx, styles } from "@uesio/ui"
import Canvas from "../../shared/canvas"
import TopLeftNav from "../../shared/topleftnav"
import BottomLeftNav from "../../shared/bottomleftnav"
import RightNav from "../../shared/rightnav"
import PropertiesPanel from "../../shared/propertiespanel"
import ComponentsPanel from "../../shared/componentspanel"
import WiresPanel from "../../shared/wirespanel"
import { BuilderState } from "./runtimebuilderdefinition"
import SlidingBuildPanels from "./SlidingBuildPanels"
const Grid = component.registry.getUtility("io.grid")

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
	TOGGLE_VIEW: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as string
			setState(state !== "content" ? "content" : "structure")
		},
		target: "buildview",
	},
})

const NAV_WIDTH = 50
const LEFT_PANEL_WIDTH = 300
const RIGHT_PANEL_WIDTH = 300

const Buildtime: FC<definition.BaseProps> = (props) => {
	console.log("rendered runtime builder")
	// const [separatorXPosition, setSeparatorXPosition] = useState<number>(0)
	const slidePanelsRef = useRef<HTMLDivElement>(null)

	const uesio = hooks.useUesio(props)
	const { context, path } = props
	const def = uesio.view.useDefinitionLocal(path)
	const viewDef = context.getViewDef()

	const scriptResult = uesio.component.usePacks(
		Object.keys(viewDef?.dependencies?.componentpacks || {}),
		true
	)

	const [state] = uesio.component.useState<BuilderState>("panels", {
		showCode: false,
		showComps: true,
		showWires: false,
	})

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
			(state.showCode ? RIGHT_PANEL_WIDTH : 0),
	})

	return (
		<Grid
			ref={slidePanelsRef}
			context={context}
			styles={{
				root: {
					height: "100vh",
					gridTemplateColumns: `${NAV_WIDTH}px ${LEFT_PANEL_WIDTH}px 1fr ${RIGHT_PANEL_WIDTH}px ${NAV_WIDTH}px`,
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
			<div
				ref={slidePanelsRef}
				className={styles.css({
					gridRow: "1 / 3",
					gridColumn: "3 / 5",
					display: "flex",
				})}
			>
				<SlidingBuildPanels
					showCode={state.showCode}
					builderContext={builderContext}
					canvasContext={canvasContext}
					slidePanelsRef={slidePanelsRef}
				/>
			</div>
			<RightNav
				context={builderContext}
				className={styles.css({
					gridRow: "1 / 3",
					gridColumn: 5,
				})}
			/>
		</Grid>
	)
}

export default Buildtime
