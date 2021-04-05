import { forwardRef, FunctionComponent } from "react"
import { createUseStyles } from "react-jss"
import { BaseProps } from "../definition/definition"
import { PanelState } from "../bands/panel/types"
import { Context } from "../context/context"

const minPagePadding = "40px"

const useStyles = createUseStyles({
	blocker: {
		position: "fixed",
		top: 0,
		bottom: 0,
		height: "100%",
		width: "100%",
		backdropFilter: "grayscale(50%) blur(5px) brightness(50%)",
	},
	root: (props: DialogProps) => ({
		position: "absolute",
		top: 0,
		bottom: 0,
		height: "100%",
		width: "100%",
		gridTemplateColumns: `minmax(${minPagePadding},1fr) minmax(auto,${
			props.definition?.width || "100%"
		}) minmax(${minPagePadding},1fr)`,
		gridTemplateRows: `minmax(${minPagePadding},1fr) minmax(auto,${
			props.definition?.height || "100%"
		}) minmax(${minPagePadding},1fr)`,
		pointerEvents: "none",
	}),
	inner: {
		boxShadow: "0 0 20px #0005",
		borderRadius: "4px",
		backgroundColor: "white",
		gridRow: "2 / 3",
		gridColumn: "2 / 3",
		pointerEvents: "auto",
	},
})

type DialogProps = {
	panel: PanelState
	close: () => Promise<Context>
} & BaseProps

const DialogBase: FunctionComponent<DialogProps> = (props) => {
	const classes = useStyles(props)
	const { panel, close } = props
	return (
		<>
			<div
				style={{
					display: panel && panel.open ? "block" : "none",
				}}
				className={classes.blocker}
				onClick={close}
			/>
			<div
				style={{
					display: panel && panel.open ? "grid" : "none",
				}}
				className={classes.root}
			>
				<div className={classes.inner}>{props.children}</div>
			</div>
		</>
	)
}

const PlainDialog = forwardRef<HTMLDivElement, DialogProps>((props, ref) => (
	<DialogBase {...props}>
		<div ref={ref} />
	</DialogBase>
))

export { DialogBase, DialogProps }

export default PlainDialog
