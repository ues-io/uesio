import { css } from "@emotion/css"

export const styles = (color: string) => css`
	.box {
		cursor: pointer;
		position: fixed;
		background-color: #eee;
		right: 2em;
		bottom: 2em;
		padding: 1.3em;
		display: grid;
		grid-template-columns: auto 1fr auto;
		column-gap: 1.3em;
		align-items: center;
		transform: translateX(8px);
		opacity: 0;
		border-radius: 3px;
		transition: transform 0.15s ease-in-out, border-left 0.1s ease 0.1s,
			opacity 0.3s ease-in-out;
		border-top-left-radius: 3px;
		border-bottom-left-radius: 3px;
		border-left: 0px solid ${color};

		&:hover .icon--close {
			color: #000;
		}

		p {
			opacity: 0;
			transition: opacity 0.125s ease-in-out 0.1s;
		}

		&.visible {
			opacity: 1;
			transform: translateX(0);
			border-left: 6px solid ${color};

			&::before {
				left: -5px;
			}

			p {
				opacity: 1;
			}
		}

		.title {
			font-weight: 700;
		}

		.icon {
			font-family: "Material Icons";

			&--rounded {
				background-color: ${color};
				padding: 4px;
				border-radius: 50%;
				color: #fff;
			}
			&--close {
				color: #aaa;
				transition: 0.125s ease-in-out;
			}
		}

		p {
			margin: 0 0 0.25em 0;
		}
	}
`

export default styles
