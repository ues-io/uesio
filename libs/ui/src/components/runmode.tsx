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
			name: route.viewname,
			namespace: route.viewnamespace,
			params: route.params,
		},
	}

	return <View {...viewprops}></View>
}

export default RunMode
