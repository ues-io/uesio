package controller

import (
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"testing"
)

func TestGetPackUrl_Workspace(t *testing.T) {

	siteMergeData := &routing.SiteMergeData{}

	type testCase struct {
		description string
		key         string
		workspace   *routing.WorkspaceMergeData
		expect      string
	}

	var tests = []testCase{
		{
			"return a workspace component pack url if a workspace is provided",
			"uesio/io.main",
			&routing.WorkspaceMergeData{
				App:  "zach/foo",
				Name: "dev",
			},
			"/workspace/zach/foo/dev/componentpacks/uesio/io/main/runtime.js",
		},
		{
			"return nothing if key is malformed",
			"asdfasfasdf",
			&routing.WorkspaceMergeData{
				App:  "zach/foo",
				Name: "dev",
			},
			"",
		},
		{
			"return nothing if namespace is malformed",
			"foo.main",
			&routing.WorkspaceMergeData{
				App:  "zach/foo",
				Name: "dev",
			},
			"",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			actual := getPackUrl(tc.key, tc.workspace, siteMergeData)
			assert.Equal(t, actual, tc.expect)
		})
	}
}

func TestGetPackUrl_Site(t *testing.T) {

	type testCase struct {
		description      string
		key              string
		site             *routing.SiteMergeData
		staticAssetsPath string
		expect           string
	}

	var tests = []testCase{
		{
			"return a versioned site component pack url",
			"uesio/io.main",
			&routing.SiteMergeData{
				Name:      "prod",
				App:       "uesio/studio",
				Version:   "v0.0.1",
				Domain:    "uesio-dev.com:3000",
				Subdomain: "studio",
			},
			"",
			"/site/componentpacks/uesio/io/v0.0.1/main/runtime.js",
		},
		{
			"substitute Uesio static assets path, if provided, for uesio prefix pack loads",
			"uesio/io.main",
			&routing.SiteMergeData{
				Name:      "prod",
				App:       "uesio/studio",
				Version:   "v0.0.1",
				Domain:    "uesio-dev.com:3000",
				Subdomain: "studio",
			},
			"/some-git-sha",
			"/site/componentpacks/uesio/io/some-git-sha/main/runtime.js",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			file.SetAssetsPath(tc.staticAssetsPath)
			actual := getPackUrl(tc.key, nil, tc.site)
			assert.Equal(t, actual, tc.expect)
		})
	}

}
