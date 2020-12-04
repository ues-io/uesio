import React, { FC } from "react"

import { BaseProps } from "../definition/definition"

import View from "./view"

const RunMode: FC<BaseProps> = (props: BaseProps) => {
	const route = props.context.getRoute()

	if (!route) {
		return null
	}

	const viewprops = {
		...props,
		definition: {
			view: `${route.viewnamespace}.${route.viewname}`,
			params: route.params,
		},
	}

	return <View {...viewprops} />
}

export default RunMode
