// it is important to set global var before any imports
;(window as unknown).__webpack_public_path__ = (window as unknown)?.monacoPublicPath

import React, { lazy, createElement, FC, Suspense } from "react"
import { LinearProgress } from "@material-ui/core"

import {
	ChangeHandler,
	EditorWillMount,
	EditorDidMount,
} from "react-monaco-editor"

const LaziestMonaco = lazy(
	() =>
		import(
			/* webpackChunkName: "react-monaco-editor" */ "react-monaco-editor"
		)
)

type Props = {
	value?: string
	language?: string
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
					language: props?.language || "yaml",
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
