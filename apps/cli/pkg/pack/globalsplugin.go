package pack

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/cli/pkg/goutils"

	"github.com/evanw/esbuild/pkg/api"
)

func GetGlobalsList(globalsMap map[string]string) []string {
	return goutils.MapKeys(globalsMap)
}

func GetGlobalsPlugin(globalsMap map[string]string) api.Plugin {

	globalsList := GetGlobalsList(globalsMap)

	return api.Plugin{
		Name: "env",
		Setup: func(build api.PluginBuild) {
			// Intercept import paths called "env" so esbuild doesn't attempt
			// to map them to a file system location. Tag them with the "env-ns"
			// namespace to reserve them for this plugin.
			build.OnResolve(api.OnResolveOptions{Filter: "^(" + strings.Join(globalsList, "|") + ")$"},
				func(args api.OnResolveArgs) (api.OnResolveResult, error) {
					return api.OnResolveResult{
						Path:      args.Path,
						Namespace: "globals",
					}, nil
				})

			// Load paths tagged with the "env-ns" namespace and behave as if
			// they point to a JSON file containing the environment variables.
			build.OnLoad(api.OnLoadOptions{Filter: `.*`, Namespace: "globals"},
				func(args api.OnLoadArgs) (api.OnLoadResult, error) {
					match, ok := globalsMap[args.Path]
					if !ok {
						return api.OnLoadResult{}, errors.New("invalid import")
					}
					contents := "module.exports = " + match
					return api.OnLoadResult{
						Contents: &contents,
					}, nil
				})
		},
	}
}
