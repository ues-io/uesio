package command

import (
	"fmt"
	"time"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/thecloudmasters/cli/pkg/pack"
)

func PackUI(options *PackOptions) error {

	if options == nil {
		options = &PackOptions{}
	}

	start := time.Now()

	globalsMap := map[string]string{
		// TODO: Adjust/Remove once final approach for global react is determined
		// "react":            "React",
		// "react-dom":        "ReactDOM",
		// "react-dom/server": "ReactDOMServer",
		// "react-dom/client": "ReactDOMClient",
		// // We're adding "react/jsx-runtime" here as a global for three reasons:
		// //    1. react-hotkeys-hook library has a module import for it
		// //    2. floating-ui/react library has a module import for it and uses jsxs
		// // TODO: It's possible that we may be able to avoid this global and configure build to
		// // resolve react/jsx-runtime.  The underlying issue relates to the fact that react/jsx-runtime
		// // paths are hardcoded in React and not exposed as an export.  See:
		// //    https://github.com/evanw/esbuild/issues/2704
		// //    https://github.com/evanw/esbuild/issues/2704#issuecomment-1329325044
		// //    https://github.com/evanw/esbuild/issues/2791
		// "react/jsx-runtime": "ReactJsxRuntime",
	}
	globalsList := pack.GetGlobalsList(globalsMap)

	buildOptions := &api.BuildOptions{
		EntryPoints:       []string{"./src/index.ts"},
		Bundle:            true,
		Outfile:           "../../dist/ui/uesio.js",
		AllowOverwrite:    true,
		External:          globalsList,
		Write:             true,
		Plugins:           []api.Plugin{pack.GetGlobalsPlugin(globalsMap)},
		TsconfigRaw:       "{}",
		MinifyWhitespace:  true,
		MinifyIdentifiers: true,
		MinifySyntax:      true,
		Format:            api.FormatESModule,
		LogLevel:          api.LogLevelDebug,
		Metafile:          true,
		Sourcemap:         api.SourceMapLinked,
	}

	err := Build(buildOptions, "../../dist/ui/meta.json", options.Watch)
	if err != nil {
		return err
	}

	fmt.Println(fmt.Sprintf("Done Packing: %v", time.Since(start)))

	// Returning from pack() exits immediately in Go.
	// Block forever so we keep watching and don't exit.
	if options.Watch {
		<-make(chan bool)
	}
	return nil
}
