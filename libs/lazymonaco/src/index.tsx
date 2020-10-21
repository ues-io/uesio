// it is important to set global var before any imports
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/camelcase
__webpack_public_path__ = window.monacoPublicPath

import React, { lazy, createElement, FC, Suspense } from "react"
import { LinearProgress } from "@material-ui/core"

import {
	ChangeHandler,
	EditorWillMount,
	EditorDidMount,
} from "react-monaco-editor"

const LaziestMonaco = lazy(() =>
	import(/* webpackChunkName: "react-monaco-editor" */ "react-monaco-editor")
)

type Props = {
	value?: string
	onChange?: ChangeHandler
	editorWillMount?: EditorWillMount
	editorDidMount?: EditorDidMount
}

const LazyMonaco: FC<Props> = (props) => {
	return (
		<Suspense fallback={createElement(LinearProgress)}>
			<LaziestMonaco
				{...{
					value: props?.value,
					language: "yaml",
					options: {
						automaticLayout: true,
						minimap: {
							enabled: false,
						},
						//quickSuggestions: true,
					},
					onChange(newValue, event): void {
						props?.onChange?.(newValue, event)
					},
					editorWillMount(monaco): void {
						props?.editorWillMount?.(monaco)
					},
					editorDidMount: async (editor, monaco): Promise<void> => {
						props?.editorDidMount?.(editor, monaco)
					},
				}}
			></LaziestMonaco>
		</Suspense>
	)
}

LazyMonaco.displayName = "LazyMonaco"

export default LazyMonaco
