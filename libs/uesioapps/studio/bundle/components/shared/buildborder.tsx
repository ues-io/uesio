import { FunctionComponent, MouseEvent } from "react"
import clsx from "clsx"
import { styles, definition } from "@uesio/ui"

const ACTIVE_COLOR = "#eee"
const SELECTED_COLOR = "#aaa"

interface Props {
	onClick?: (event: MouseEvent) => void
	onMouseEnter?: (event: MouseEvent) => void
	onMouseLeave?: (event: MouseEvent) => void
	setDragging?: (event: MouseEvent) => void
	isSelected?: boolean
	isActive?: boolean
	title?: string
	isStructureView: boolean
	definition?: definition.BaseDefinition
}

const getColor = ({ isSelected }: Props) =>
	isSelected ? SELECTED_COLOR : ACTIVE_COLOR
const getOutline = (props: Props) =>
	props.isActive || props.isSelected ? `1px solid ${getColor(props)}` : "none"
const getBackgroundColor = ({ isSelected }: Props) =>
	isSelected ? "white" : "transparent"
const deepShadow =
	"0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)"
const useStyles = styles.getUseStyles(
	["mask", "maskStructureView", "header", "headerStructureView"],
	{
		mask: (props: Props) => ({
			outline: getOutline(props),
			boxShadow: props.isSelected ? deepShadow : "none",
			backgroundColor: getBackgroundColor(props),
		}),

		maskStructureView: (props: Props) => ({
			backgroundColor: getBackgroundColor(props),
			outline: props.isSelected ? getOutline(props) : "",
			border: props.isSelected
				? "1px solid transparent"
				: `1px solid ${props.isActive ? SELECTED_COLOR : ACTIVE_COLOR}`,
			boxShadow: props.isSelected ? deepShadow : "none",
		}),

		header: (props: Props) => ({
			boxShadow: props.isSelected ? deepShadow : "none",
			outline: getOutline(props),
			position: "absolute",
			top: "-24px",
			left: 0,
			fontSize: "9pt",
			textTransform: "uppercase",
			color: "#333",
			padding: "8px 8px 0 10px",
			opacity: 0.95,
			fontWeight: "bold",
			backgroundColor: getBackgroundColor(props),
			width: "100%",
			"&::after": {
				height: "7px",
				width: "100%",
				backgroundColor: "white",
				content: "''",
				position: "absolute",
				bottom: "-7px",
				left: 0,
			},
		}),
		headerStructureView: {
			color: "#333",
			fontWeight: "bold",
			padding: "8px 8px 4px 10px",
			textTransform: "uppercase",
			fontSize: "9pt",
		},
	}
)

const BuildBorder: FunctionComponent<Props> = (props) => {
	const {
		onClick,
		onMouseEnter,
		onMouseLeave,
		isSelected,
		setDragging,
		isActive,
		isStructureView,
		children,
		title,
	} = props
	const classes = useStyles(props)
	const wrapperClass = clsx({
		[classes.maskStructureView]: isStructureView,
		[classes.mask]: (isActive || isSelected) && !isStructureView,
	})
	const headerClass = isStructureView
		? classes.headerStructureView
		: classes.header
	return (
		<div
			className={wrapperClass}
			// Using MouseDown here instead of Click because of weirdness
			// with propagation.
			onMouseDown={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{(isSelected || isStructureView) && (
				<div onMouseDown={setDragging} className={headerClass}>
					{title}
				</div>
			)}
			{children}
		</div>
	)
}

export default BuildBorder
