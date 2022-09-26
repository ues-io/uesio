package command

import (
	"fmt"
	"io/ioutil"
	"time"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/thecloudmasters/clio/pkg/pack"
)

func PackUI(options *PackOptions) error {

	if options == nil {
		options = &PackOptions{}
	}

	start := time.Now()

	globalsMap := map[string]string{
		"react":     "React",
		"react-dom": "ReactDOM",
		//"redux":       "Redux",
		//"react-redux": "ReactRedux",
		//"yaml":         "yaml",
		"@emotion/css": "emotion",
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
		MinifyWhitespace:  true,
		MinifyIdentifiers: true,
		MinifySyntax:      true,
		Format:            api.FormatESModule,
		LogLevel:          api.LogLevelDebug,
		Metafile:          true,
	}

	if options.Watch {
		pack.ModifyWatchOptions(buildOptions)
	}

	// Then pack with esbuild
	result := api.Build(*buildOptions)
	if result.Errors != nil {
		pack.HandleBuildErrors(result.Errors)
	}

	ioutil.WriteFile("../../dist/ui/meta.json", []byte(result.Metafile), 0644)

	fmt.Println(fmt.Sprintf("Done Packing: %v", time.Since(start)))

	// Returning from pack() exits immediately in Go.
	// Block forever so we keep watching and don't exit.
	if options.Watch {
		<-make(chan bool)
	}
	return nil
}
