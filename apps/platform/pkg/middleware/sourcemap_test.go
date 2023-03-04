package middleware

import (
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/config"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestServeComponentPackFile(t *testing.T) {
	tests := []struct {
		name                  string
		path                  string
		inDevMode             bool
		expectSourceMapHeader string
	}{
		{
			"(DEV MODE) react.js file - no source map",
			"/static/vendor/react.development.js",
			true,
			"",
		},
		{
			"(DEV MODE) uesio.js file - YES source map",
			"/static/vendor/uesio.js",
			true,
			"/static/vendor/uesio.js.map",
		},
		{
			"(DEV MODE) SITE mode, io pack runtime.js file - YES source map",
			"/site/componentpacks/uesio/io/v0.0.1/main/runtime.js",
			true,
			"/site/componentpacks/uesio/io/v0.0.1/main/runtime.js.map",
		},
		{
			"SITE mode, runtime.js file -> no source map expected",
			"/site/componentpacks/joe/foo/v0.0.2/main/runtime.js",
			false,
			"",
		},
		{
			"SITE mode, someother.js file -> no source map expected",
			"/site/componentpacks/joe/foo/v0.0.2/main/someother.js",
			false,
			"",
		},
		{
			"WORKSPACE mode, runtime.js file -> YES source map expected",
			"/workspace/joe/foo/componentpacks/joe/foo/v0.0.2/main/runtime.js",
			false,
			"/workspace/joe/foo/componentpacks/joe/foo/v0.0.2/main/runtime.js.map",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", tt.path, nil)
			rr := httptest.NewRecorder()
			config.SetDevMode(tt.inDevMode)
			AddSourceMapHeaderIfNecessary(rr, req)
			assert.Equal(t, tt.expectSourceMapHeader, rr.Header().Get("SourceMap"))
		})
	}
}
