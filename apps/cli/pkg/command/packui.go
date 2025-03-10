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
		// TODO: if/when packui is removed and ui project moves to using a bundler directly in build.sh
		// the bundler can be used to generate separate scripts for React* and then the globals
		// should be added in this map for react, react-dom, react-dom/client & react/jsx-runtime
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
