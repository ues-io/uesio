package command

import (
	"fmt"
	"io/ioutil"
	"time"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/thecloudmasters/clio/pkg/pack"
)

type PackOptions struct {
	Zip   bool
	Watch bool
}

func Pack(options *PackOptions) error {

	if options == nil {
		options = &PackOptions{}
	}

	start := time.Now()

	globalsMap := map[string]string{
		"react":        "React",
		"react-dom":    "ReactDOM",
		"@uesio/ui":    "uesio",
		"@emotion/css": "emotion",
	}

	entryPoints, err := pack.CreateEntryFiles()
	if err != nil {
		return err
	}

	for packName, entryPoint := range entryPoints {

		buildOptions := &api.BuildOptions{
			EntryPoints:       []string{entryPoint},
			Bundle:            true,
			Outdir:            "bundle/componentpacks",
			Outbase:           "bundle/componentpacks",
			AllowOverwrite:    true,
			External:          pack.GetGlobalsList(globalsMap),
			Write:             true,
			Plugins:           []api.Plugin{pack.GetGlobalsPlugin(globalsMap)},
			MinifyWhitespace:  true,
			MinifyIdentifiers: true,
			MinifySyntax:      true,
			Metafile:          true,
			Sourcemap:         api.SourceMapLinked,
		}

		if options.Watch {
			pack.ModifyWatchOptions(buildOptions)
		}
		// Then pack with esbuild
		result := api.Build(*buildOptions)
		if result.Errors != nil {
			pack.HandleBuildErrors(result.Errors)
		}

		baseURL := fmt.Sprintf("bundle/componentpacks/%s/", packName)
		metaURL := fmt.Sprintf("%sdist/meta.json", baseURL)

		ioutil.WriteFile(metaURL, []byte(result.Metafile), 0644)

		fmt.Println(fmt.Sprintf("Done Packing %s: %v", packName, time.Since(start)))
	}

	fmt.Println(fmt.Sprintf("Done Packing All: %v", time.Since(start)))

	// Returning from pack() exits immediately in Go.
	// Block forever so we keep watching and don't exit.
	if options.Watch {
		<-make(chan bool)
	}
	return nil
}
