import { styles } from "@uesio/ui"

const getButtonStyles = (): styles.CSSProperties => ({
	backgroundColor: "rgb(238, 111, 85)",
	display: "inline-flex",
	alignItems: "center",
	color: "white",
	padding: 0,
	border: 0,
	fontSize: "14px",
	fontWeight: 500,
	fontFamily: "Roboto, sans-serif",
	width: "210px",
	cursor: "pointer",
	textTransform: "unset",
})

export { getButtonStyles }
