// it is important to set global var before any imports

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let __webpack_public_path__: string

declare global {
	interface Window {
		monacoPublicPath: string
	}
}

import React, { lazy, createElement, FunctionComponent, Suspense } from "react"
import { LinearProgress } from "@material-ui/core"

import {
	ChangeHandler,
	EditorWillMount,
	EditorDidMount,
} from "react-monaco-editor"

// eslint-disable-next-line prefer-const
__webpack_public_path__ = window.monacoPublicPath

const LaziestMonaco = lazy(
	() =>
		import(
			/* webpackChunkName: "react-monaco-editor" */ "react-monaco-editor"
		)
)

interface Props {
	value?: string
	language?: string
	onChange?: ChangeHandler
	editorWillMount?: EditorWillMount
	editorDidMount?: EditorDidMount
}

const LazyMonaco: FunctionComponent<Props> = (props) => (
	<Suspense fallback={createElement(LinearProgress)}>
		<LaziestMonaco
			value={props?.value}
			language={props?.language || "yaml"}
			options={{
				automaticLayout: true,
				minimap: {
					enabled: false,
				},
				//quickSuggestions: true,
			}}
			onChange={(newValue, event): void => {
				props?.onChange?.(newValue, event)
			}}
			editorWillMount={(monaco): void => {
				props?.editorWillMount?.(monaco)
			}}
			editorDidMount={async (editor, monaco): Promise<void> => {
				props?.editorDidMount?.(editor, monaco)
			}}
		/>
	</Suspense>
)

LazyMonaco.displayName = "LazyMonaco"

export default LazyMonaco
