import { FunctionComponent } from "react"
import { useNProgress } from "@tanem/react-nprogress"
import { component } from "@uesio/ui"
import { ProgressContainerUtilityProps } from "../../utility/progresscontainer/progresscontainer"
import { ProgressBarUtilityProps } from "../../utility/progressbar/progressbar"
import { ProgressProps } from "./progressdefinition"
import { ProgressCircleUtilityProps } from "../../utility/progresscircle/progresscircle"

const ProgressContainer = component.getUtility<ProgressContainerUtilityProps>(
	"uesio/io.progresscontainer"
)
const ProgressBar = component.getUtility<ProgressBarUtilityProps>(
	"uesio/io.progressbar"
)
const ProgressCircle = component.getUtility<ProgressCircleUtilityProps>(
	"uesio/io.progresscircle"
)
const Progress: FunctionComponent<ProgressProps> = (props) => {
	const { definition, context } = props
	const isAnimating = definition.isAnimating
	const isCircular = definition.type === "circular"

	const { animationDuration, isFinished, progress } = useNProgress({
		isAnimating,
	})

	console.log({ isCircular, animationDuration })

	return (
		<ProgressContainer
			animationDuration={animationDuration}
			isFinished={isFinished}
			context={context}
		>
			{isCircular ? (
				<ProgressCircle
					animationDuration={animationDuration}
					progress={progress}
					context={context}
				/>
			) : (
				<ProgressBar
					animationDuration={animationDuration}
					progress={progress}
					context={context}
				/>
			)}
		</ProgressContainer>
	)
}

export default Progress
