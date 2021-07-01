import { CSSInterpolation } from "@emotion/css"

export const toggleStyles = (
	primaryColor: string,
	mode = ""
): { [key: string]: CSSInterpolation } => ({
	display: "flex",
	justifyContent: "center",
	flexFlow: "column",
	userSelect: "none",
	".switch": {
		position: "relative",
		display: "inline-block",
		width: "2.5em",
		height: "1.5em",

		input: {
			opacity: "0",
			width: "0",
			height: "0",

			"&:checked + .slider": {
				backgroundColor: primaryColor,
			},
			"&:checked + .slider:before": {
				transform: "translateX(1em)",
			},
			"&::focus + .slider": {
				boxShadow: "0 0 1p " + primaryColor,
			},
		},
		".slider": {
			position: "absolute",
			backgroundColor: "#ccc",
			cursor: mode === "READ" ? "not-allowed" : "pointer",
			inset: "0 0 0 0",
			transition: ".4s",

			"&.round": {
				borderRadius: "34px",
			},
			"&.round:before": {
				borderRadius: "50%",
			},

			"&:before": {
				position: "absolute",
				content: '""',
				height: "1em",
				width: "1em",
				left: "4px",
				bottom: "4px",
				backgroundColor: "white",
				transition: ".4s",

				"@media (prefers-reduced-motion: reduce)": {
					transition: "none",
				},
			},
		},
	},
})

export default toggleStyles
