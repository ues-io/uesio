import { styles } from "@uesio/ui"

const getButtonWidth = () => "210px"

const getButtonStyles = (): styles.CSSProperties => ({
	backgroundColor: "rgb(255, 255, 255)",
	display: "inline-flex",
	alignItems: "center",
	color: "rgba(0, 0, 0, 0.54)",
	boxShadow:
		"rgba(0, 0, 0, 0.24) 0px 2px 2px 0px, rgba(0, 0, 0, 0.24) 0px 0px 1px 0px",
	padding: 0,
	borderRadius: "2px",
	border: "1px solid transparent",
	fontSize: "14px",
	fontWeight: 500,
	fontFamily: "Roboto, sans-serif",
	width: getButtonWidth(),
	cursor: "pointer",
	textTransform: "unset",
})

export { getButtonWidth, getButtonStyles }
