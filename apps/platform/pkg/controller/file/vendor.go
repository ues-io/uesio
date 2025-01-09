package file

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

type vendorScript struct {
	Path    string `json:"path"`
	Version string `json:"version"`
	Preload bool   `json:"preload"`
	Order   int    `json:"order"`
}

var vendorDistDir string
var vendorScriptUrls []string
var vendorAssetsHost string
var monacoEditorVersion string

func init() {
	baseDir := ""
	wd, _ := os.Getwd()
	// Handle path resolution issues when running tests
	appsPlatformDir := filepath.Join("apps", "platform")
	if strings.Contains(wd, appsPlatformDir) {
		baseDir, _, _ = strings.Cut(wd, appsPlatformDir)
	}
	vendorAssetsHost = GetAssetsHost()

	// Read in the vendor manifest file (from local filesystem)
	// so that we can build the list of vendor script URLs
	vendorDistDir = filepath.Join(baseDir, "dist", "vendor")
	manifestFilePath := filepath.Join(vendorDistDir, "manifest.json")
	vendorScriptsManifestFile, err := os.ReadFile(manifestFilePath)

	if err != nil {
		fmt.Println("Unable to read vendor scripts manifest file")
		panic(err)
	}

	vendorManifest := map[string]vendorScript{}

	err = json.Unmarshal(vendorScriptsManifestFile, &vendorManifest)

	if err != nil {
		fmt.Println("Unable to parse vendor scripts manifest")
		panic(err)
	}

	type orderedScriptLoad struct {
		url   string
		order int
	}

	orderedScriptLoads := make([]orderedScriptLoad, 0, len(vendorManifest))

	for scriptModule, scriptManifest := range vendorManifest {
		if scriptModule == "monaco-editor" {
			monacoEditorVersion = scriptManifest.Version
		}
		if !scriptManifest.Preload || scriptManifest.Path == "" {
			continue
		}
		scriptUrl := fmt.Sprintf("%s/static/vendor/%s/%s/%s", vendorAssetsHost, scriptModule, scriptManifest.Version, scriptManifest.Path)

		orderedScriptLoads = append(orderedScriptLoads, orderedScriptLoad{
			order: scriptManifest.Order,
			url:   scriptUrl,
		})
	}

	// Sort the script loads by their order
	sort.Slice(orderedScriptLoads, func(i, j int) bool {
		return orderedScriptLoads[i].order < orderedScriptLoads[j].order
	})

	vendorScriptUrls = make([]string, len(orderedScriptLoads))

	// Now output an actual array of script urls
	for i, scriptLoad := range orderedScriptLoads {
		vendorScriptUrls[i] = scriptLoad.url
	}
}

func GetMonacoEditorVersion() string {
	return monacoEditorVersion
}

func GetVendorAssetsHost() string {
	return vendorAssetsHost
}

func GetVendorScriptUrls() []string {
	return vendorScriptUrls
}

// ServeVendor is a handler for serving a vendored script file, e.g. React, etc.
func ServeVendor(routePrefix string, cache bool) http.Handler {
	fileServer := http.FileServer(http.Dir(vendorDistDir))
	handler := http.StripPrefix(routePrefix, fileServer)
	if vendorAssetsHost != "" {
		handler = middleware.WithAccessControlAllowOriginHeader(handler, "*")
	}
	if cache {
		handler = middleware.With1YearCache(handler)
	}
	return handler
}
