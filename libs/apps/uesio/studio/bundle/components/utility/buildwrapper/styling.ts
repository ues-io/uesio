import { CSSInterpolation } from "@emotion/css"
const transition = "all 0.3s ease"

export default (
	isSelected: boolean,
	isActive: boolean,
	isDraggingMe: boolean
): Record<string, CSSInterpolation> => {
	const SELECTED_COLOR = "#aaa"
	const HOVER_COLOR = "#aaaaaaae"
	const INACTIVE_COLOR = "#eee"

	const borderColor = (() => {
		if (isSelected) return SELECTED_COLOR
		if (isActive) return HOVER_COLOR
		return INACTIVE_COLOR
	})()

	return {
		root: {
			cursor: "pointer",
			position: "relative",
			userSelect: "none",
			zIndex: isSelected ? 1 : 0,
			transition: "all 0.18s ease",
			"&:hover": {
				zIndex: 1,
			},
			...(isDraggingMe && {
				display: "none",
			}),
			padding: "6px",
		},
		wrapper: {
			border: `1px solid ${borderColor}`,
			borderRadius: "4px",
			overflow: "hidden",
		},
		placeholder: {
			padding: "6px",
		},
		placeholderInner: {
			minWidth: "40px",
			minHeight: "40px",
			borderRadius: "4px",
			border: "1px dashed #ccc",
			backgroundColor: "#e5e5e5",
			height: "100%",
		},
		afterPlaceholder: {
			display: "none",
			"&:last-child": {
				display: "block",
			},
		},
		header: {
			color: "#333",
			backgroundColor: isSelected ? "white" : "transparent",
			padding: "10px 10px 2px",
			textTransform: "uppercase",
			fontSize: "8pt",
			display: "flex",
			alignItems: "center",
		},
		inner: {
			padding: "8px",
			position: "relative",
			overflow: "auto",
		},
		wireIndicator: {
			display: "inline-flex",
			justifyContent: "center",
			alignItems: "center",
			margin: "0 1em 0 5px",
			color: "#eee",
			transform: "translateX(-0.5em)",
			transition,

			".wireName": {
				border: "2px solid #eee",
				borderRadius: "1em",
				padding: "0 1em",
				color: "#000",
				backgroundColor: "#fff",
				zIndex: 1,
			},

			".wireDash": {
				transform: "translateX(100%)",
			},

			".dottie": {
				width: "0.5em",
				height: "0.5em",
				borderRadius: "50%",
				border: "2px solid ",
				opacity: 0,
				transition,
				transform: "translateX(50%)",
			},

			"&:hover": {
				transform: "translateX(0)",

				".wireName": {
					border: `2px solid ${SELECTED_COLOR}`,
				},

				".dottie": {
					transform: "translateX(0%)",

					opacity: 1,
					border: `2px solid ${SELECTED_COLOR}`,
				},

				".wireDash": {
					transform: "translateX(0%)",
					opacity: 1,
					fontWeight: "bold",
					color: SELECTED_COLOR,
				},
			},
		},
	}
}
