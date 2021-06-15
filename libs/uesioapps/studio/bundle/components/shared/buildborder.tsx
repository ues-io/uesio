import { FunctionComponent, MouseEvent } from "react"
import { styles } from "@uesio/ui"

const ACTIVE_COLOR = "#eee"
const SELECTED_COLOR = "#aaa"

interface Props {
	onClick?: (event: MouseEvent) => void
	onMouseEnter?: (event: MouseEvent) => void
	onMouseLeave?: (event: MouseEvent) => void
	setDragging?: (event: MouseEvent) => void
	stopDragging?: (event: MouseEvent) => void
	isSelected?: boolean
	isActive?: boolean
	title?: string
	isStructureView: boolean
}

const getColor = ({ isSelected }: Props) =>
	isSelected ? SELECTED_COLOR : ACTIVE_COLOR
const getOutline = (props: Props) =>
	props.isActive || props.isSelected ? `1px solid ${getColor(props)}` : "none"
const getBackgroundColor = ({ isSelected }: Props) =>
	isSelected ? "white" : "transparent"
const deepShadow =
	"0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)"

const BuildBorder: FunctionComponent<Props> = (props) => {
	const {
		onClick,
		onMouseEnter,
		onMouseLeave,
		isSelected,
		setDragging,
		stopDragging,
		isActive,
		isStructureView,
		children,
		title,
	} = props
	const isContentViewSelected = (isActive || isSelected) && !isStructureView
	const classes = styles.useStyles(
		{
			mask: {
				...(isStructureView && {
					outline: isSelected ? getOutline(props) : "",
					border: isSelected
						? "1px solid transparent"
						: `1px solid ${
								isActive ? SELECTED_COLOR : ACTIVE_COLOR
						  }`,
				}),
				...(isContentViewSelected && {
					position: "relative",
					outline: getOutline(props),
				}),
				...((isActive || isSelected || !isStructureView) && {
					backgroundColor: getBackgroundColor(props),
					boxShadow: isSelected ? deepShadow : "none",
				}),
			},

			inner: {
				position: "relative",
				overflow: isStructureView ? "auto" : "visible",
			},

			header: {
				color: "#333",
				fontWeight: "bold",
				backgroundColor: getBackgroundColor(props),
				padding: "10px",
				textTransform: "uppercase",
				fontSize: "9pt",
				...(!isStructureView && {
					boxShadow: props.isSelected ? deepShadow : "none",
					outline: getOutline(props),
					position: "absolute",
					top: "-34px",
					left: "-8px",
					right: "-8px",
					bottom: "-8px",
				}),
			},
		},
		null
	)

	return (
		<div
			className={classes.mask}
			// Using MouseDown here instead of Click because of weirdness
			// with propagation.
			onMouseDown={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{(isSelected || isStructureView) && (
				<div
					onMouseDown={setDragging}
					onMouseUp={stopDragging}
					className={classes.header}
				>
					{title}
				</div>
			)}
			<div className={classes.inner}>{children}</div>
		</div>
	)
}

export default BuildBorder
