import React, { FC } from "react"
import { BaseProps } from "../definition/definition"

const NotFound: FC<BaseProps> = () => {
	return <div>Component Not Found</div>
}

NotFound.displayName = "NotFound"

export default NotFound
