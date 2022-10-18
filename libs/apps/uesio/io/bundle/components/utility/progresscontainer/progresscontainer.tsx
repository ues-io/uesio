import { FunctionComponent } from "react"
import { definition } from "@uesio/ui"

interface ProgressContainerUtilityProps extends definition.UtilityProps {
	animationDuration: number
	isFinished: boolean
}

const ProgressContainer: FunctionComponent<ProgressContainerUtilityProps> = ({
	animationDuration,
	children,
	isFinished,
}) => (
	<div
		style={{
			opacity: isFinished ? 0 : 1,
			pointerEvents: "none",
			transition: `opacity ${animationDuration}ms linear`,
		}}
	>
		{children}
	</div>
)

export { ProgressContainerUtilityProps }

export default ProgressContainer
