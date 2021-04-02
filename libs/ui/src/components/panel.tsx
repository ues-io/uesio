import { FunctionComponent, useEffect, useRef } from "react"
import { createUseStyles } from "react-jss"
import { BaseProps, DefinitionMap } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import { set as setPanel } from "../bands/panel"
import { usePanel } from "../bands/panel/selectors"

const useStyles = createUseStyles({
	blocker: {
		position: "fixed",
		top: 0,
		bottom: 0,
		height: "100%",
		width: "100%",
		backdropFilter: "grayscale(50%) blur(5px) brightness(50%)",
	},
	root: {
		position: "absolute",
		top: 0,
		bottom: 0,
		height: "100%",
		width: "100%",
		gridTemplateColumns: "10% 1fr 10%",
		gridTemplateRows: "10% 1fr 10%",
		pointerEvents: "none",
	},
	inner: {
		boxShadow: "0 0 20px #0005",
		borderRadius: "4px",
		backgroundColor: "white",
		gridRow: "2 / 3",
		gridColumn: "2 / 3",
		pointerEvents: "auto",
	},
})

type PanelInfo = {
	domNode: HTMLDivElement | null
	definition: DefinitionMap | undefined
}

const panelRegistry: Record<string, PanelInfo> = {}

const Panel: FunctionComponent<BaseProps> = (props) => {
	const classes = useStyles(props)
	const uesio = useUesio(props)
	const panelId = props.definition?.id as string
	const ref = useRef<HTMLDivElement>(null)

	const panel = usePanel(panelId)

	useEffect(() => {
		uesio.getDispatcher()(
			setPanel({
				id: panelId,
				open: false,
				contextPath: "",
			})
		)
		panelRegistry[panelId] = {
			domNode: ref.current,
			definition: props.definition,
		}
	}, [])

	return (
		<>
			<div
				style={{
					display: panel && panel.open ? "block" : "none",
				}}
				className={classes.blocker}
				onClick={uesio.signal.getHandler([
					{
						signal: "panel/TOGGLE",
						panel: panelId,
					},
				])}
			/>
			<div
				style={{
					display: panel && panel.open ? "grid" : "none",
				}}
				className={classes.root}
			>
				<div ref={ref} className={classes.inner} />
			</div>
		</>
	)
}

export { panelRegistry }
export default Panel
