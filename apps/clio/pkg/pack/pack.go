package pack

import (
	"fmt"

	"github.com/evanw/esbuild/pkg/api"
)

func ModifyWatchOptions(options *api.BuildOptions) {
	options.Watch = &api.WatchMode{OnRebuild: func(result api.BuildResult) {
		if len(result.Errors) > 0 {
			fmt.Printf("watch build failed: %d errors\n", len(result.Errors))
		} else {
			fmt.Printf("watch build succeeded: %d warnings\n", len(result.Warnings))
		}
	}}
	options.Define = map[string]string{"process.env.NODE_ENV": `"development"`}
	options.MinifyWhitespace = false
	options.MinifyIdentifiers = false
	options.MinifySyntax = false
	options.Sourcemap = api.SourceMapLinked
}

func HandleBuildErrors(errors []api.Message) {
	for _, err := range errors {
		fmt.Println(err)
		fmt.Println(err.Location)
	}
}
