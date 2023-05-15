package file

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/middleware"
)

type vendorScript struct {
	Path    string `json:"path"`
	Version string `json:"version"`
}

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

	vendorAssetsHost = ""

	manifestFilePath := filepath.Join(baseDir, "dist", "vendor", "manifest.json")
	vendorScriptsManifestFile, err := ioutil.ReadFile(manifestFilePath)

	if err != nil {
		fmt.Println("Unable to read vendor scripts manifest file")
		panic(err)
	}

	vendorScriptUrls = []string{}
	vendorManifest := map[string]vendorScript{}

	err = json.Unmarshal([]byte(vendorScriptsManifestFile), &vendorManifest)

	if err != nil {
		fmt.Println("Unable to parse vendor scripts manifest")
		panic(err)
	}

	for scriptModule, scriptManifest := range vendorManifest {
		if scriptModule == "monaco-editor" {
			monacoEditorVersion = scriptManifest.Version
		}
		if scriptManifest.Path == "" {
			continue
		}
		scriptUrl := fmt.Sprintf("%s/static/vendor/%s/%s/%s", vendorAssetsHost, scriptModule, scriptManifest.Version, scriptManifest.Path)
		vendorScriptUrls = append(vendorScriptUrls, scriptUrl)
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

// ServeVendorScript is a handler for serving a vendored script file, e.g. React / React DOM, etc.
func ServeVendorScript(currentWorkingDirectory, routePrefix string, cache bool) http.Handler {
	fileServer := http.FileServer(http.Dir(filepath.Join(currentWorkingDirectory, "..", "..", "dist", "vendor")))
	handler := http.StripPrefix(routePrefix, fileServer)
	if cache {
		handler = middleware.With1YearCache(handler)
	}
	return handler
}
