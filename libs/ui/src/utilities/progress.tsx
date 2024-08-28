import { useNProgress } from "@tanem/react-nprogress"
import { UtilityComponent } from "../definition/definition"
import { useRouteLoading } from "../bands/route/selectors"
import { useRef } from "react"

const Container: UtilityComponent<{
	animationDuration: number
	isFinished: boolean
}> = ({ animationDuration, children, isFinished }) => (
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

const Bar: UtilityComponent<{
	animationDuration: number
	progress: number
}> = ({ animationDuration, progress }) => (
	<div
		style={{
			background: "#29d",
			height: 2,
			left: 0,
			marginLeft: `${(-1 + progress) * 100}%`,
			position: "fixed",
			top: 0,
			transition: `margin-left ${animationDuration}ms linear`,
			width: "100%",
			zIndex: 1031,
		}}
	>
		<div
			style={{
				boxShadow: "0 0 10px #29d, 0 0 5px #29d",
				display: "block",
				height: "100%",
				opacity: 1,
				position: "absolute",
				right: 0,
				transform: "rotate(3deg) translate(0px, -4px)",
				width: 100,
			}}
		/>
	</div>
)

const Progress: UtilityComponent = (props) => {
	const isAnimating = useRouteLoading()
	const key = useRef(0)
	if (isAnimating) {
		key.current = key.current + 1
	}
	return (
		<ProgressInternal
			context={props.context}
			isAnimating={isAnimating}
			key={key.current}
		/>
	)
}

const ProgressInternal: UtilityComponent<{
	isAnimating: boolean
}> = (props) => {
	const { context, isAnimating } = props

	const { animationDuration, isFinished, progress } = useNProgress({
		isAnimating,
	})

	return (
		<Container
			animationDuration={animationDuration}
			isFinished={isFinished}
			context={context}
		>
			<Bar
				animationDuration={animationDuration}
				progress={progress}
				context={context}
			/>
		</Container>
	)
}

export default Progress
