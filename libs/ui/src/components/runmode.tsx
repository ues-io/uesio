import { FunctionComponent } from "react"

import { BaseProps } from "../definition/definition"

import View from "./view"

const RunMode: FunctionComponent<BaseProps> = ({ context }) => {
	const route = context.getRoute()

	if (!route) return null

	return (
		<View
			context={context}
			definition={{
				view: route.view,
				params: route.params,
			}}
		/>
	)
}

export default RunMode
