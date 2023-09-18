package controller

import (
	"fmt"
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func TestGetPackUrl_Workspace(t *testing.T) {

	siteMergeData := &routing.SiteMergeData{
		App:     "luigi/stuff",
		Version: "v1.2.3",
	}
	staticAssetsPath := "/abcd1234"

	type testCase struct {
		description      string
		key              string
		workspace        *routing.WorkspaceMergeData
		staticAssetsPath string
		expect           string
	}

	timestamp := int64(1234567890)

	var tests = []testCase{
		{
			"return a workspace component pack url",
			"zach/foo.main",
			&routing.WorkspaceMergeData{
				App:  "zach/foo",
				Name: "dev",
			},
			staticAssetsPath,
			"/workspace/zach/foo/dev/componentpacks/zach/foo/1234567890/main/runtime.js",
		},
		{
			"return a workspace component pack url with correct pack",
			"zach/foo.other",
			&routing.WorkspaceMergeData{
				App:  "zach/foo",
				Name: "test",
			},
			staticAssetsPath,
			"/workspace/zach/foo/test/componentpacks/zach/foo/1234567890/other/runtime.js",
		},
		{
			"return nothing if key is malformed",
			"asdfasfasdf",
			&routing.WorkspaceMergeData{
				App:  "zach/foo",
				Name: "dev",
			},
			"",
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
			"",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			file.SetAssetsPath(tc.staticAssetsPath)
			actual := getPackUrl(tc.key, timestamp, tc.workspace, siteMergeData)
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

	PackUpdatedAt := int64(123456789)
	UesioAppGitSha := "/abcd1234"

	var tests = []testCase{
		{
			"[custom app] use Site dependencies to get the requested pack URL",
			"ben/mosaic.main",
			&routing.SiteMergeData{
				App:     "zach/foo",
				Version: "v0.0.2",
				Dependencies: map[string]meta.BundleDefDep{
					"uesio/io": {
						Version: "v0.0.1",
					},
					"ben/mosaic": {
						Version: "v1.2.1",
					},
				},
			},
			UesioAppGitSha,
			"/site/componentpacks/ben/mosaic/v1.2.1/main/runtime.js",
		},
		{
			"[custom app] use pack's modstamp if no Site dependencies are found",
			"ben/mosaic.main",
			&routing.SiteMergeData{
				App:     "zach/foo",
				Version: "v0.0.2",
			},
			UesioAppGitSha,
			fmt.Sprintf("/site/componentpacks/ben/mosaic/%d/main/runtime.js", PackUpdatedAt),
		},
		{
			"[custom app] use site version if the pack is in the app",
			"zach/foo.main",
			&routing.SiteMergeData{
				App:     "zach/foo",
				Version: "v0.2.4",
			},
			UesioAppGitSha,
			"/site/componentpacks/zach/foo/v0.2.4/main/runtime.js",
		},
		{
			"[custom app] substitute Uesio static assets path, if provided, for system bundle pack loads only",
			"uesio/io.main",
			&routing.SiteMergeData{
				App:     "zach/foo",
				Version: "v0.2.4",
			},
			UesioAppGitSha,
			fmt.Sprintf("/site/componentpacks/uesio/io%s/main/runtime.js", UesioAppGitSha),
		},
		{
			"[custom app] use the correct dependency for non-system-bundle Uesio pack loads",
			"uesio/extras.main",
			&routing.SiteMergeData{
				App:     "uesio/www",
				Version: "v0.0.8",
				Dependencies: map[string]meta.BundleDefDep{
					"uesio/io": {
						Version: "v0.0.1",
					},
					"uesio/extras": {
						Version: "v1.2.1",
					},
				},
			},
			UesioAppGitSha,
			"/site/componentpacks/uesio/extras/v1.2.1/main/runtime.js",
		},
		{
			"[system app] use the Uesio App git sha if the request is for a system namespace bundle",
			"uesio/io.main",
			&routing.SiteMergeData{
				App:     "uesio/studio",
				Version: "v0.0.1",
				Dependencies: map[string]meta.BundleDefDep{
					"uesio/io": {
						Version: "v0.0.1",
					},
					"uesio/core": {
						Version: "v0.0.1",
					},
				},
			},
			UesioAppGitSha,
			fmt.Sprintf("/site/componentpacks/uesio/io%s/main/runtime.js", UesioAppGitSha),
		},
		{
			"[system app] prefer the pack modstamp if the request is for a system namespace bundle but we have no Gitsha (local dev)",
			"uesio/io.main",
			&routing.SiteMergeData{
				App:     "uesio/studio",
				Version: "v0.0.1",
				Dependencies: map[string]meta.BundleDefDep{
					"uesio/io": {
						Version: "v0.0.1",
					},
					"uesio/core": {
						Version: "v0.0.1",
					},
				},
			},
			"",
			fmt.Sprintf("/site/componentpacks/uesio/io/%d/main/runtime.js", PackUpdatedAt),
		},
	}

	for _, tc := range tests {
		t.Run(tc.description, func(t *testing.T) {
			file.SetAssetsPath(tc.staticAssetsPath)
			actual := getPackUrl(tc.key, PackUpdatedAt, nil, tc.site)
			assert.Equal(t, tc.expect, actual)
		})
	}

}

func Test_getComponentPackURLs(t *testing.T) {

	siteMergeData := &routing.SiteMergeData{
		Name:      "prod",
		App:       "uesio/studio",
		Version:   "v0.0.1",
		Domain:    "uesio-dev.com:3000",
		Subdomain: "studio",
	}

	workspaceMergeData := &routing.WorkspaceMergeData{
		App:  "zach/foo",
		Name: "test",
	}

	ioPack := meta.NewBaseComponentPack("uesio/io", "main")
	ioPack.UpdatedAt = 12341111111

	mainPack := meta.NewBaseComponentPack("zach/foo", "main")
	mainPack.UpdatedAt = 1234500005

	otherPack := meta.NewBaseComponentPack("zach/foo", "other")
	otherPack.UpdatedAt = 1234599999

	acmePack := meta.NewBaseComponentPack("acme/stuff", "main")
	acmePack.UpdatedAt = 1234577777

	type args struct {
		componentPackDeps *routing.MetadataMergeData
		workspace         *routing.WorkspaceMergeData
		site              *routing.SiteMergeData
	}

	tests := []struct {
		name string
		args args
		want []string
	}{
		{
			"it should use pack UpdatedAt to generate workspace pack URLs",
			args{
				componentPackDeps: routing.NewItem().AddItems(ioPack, mainPack, otherPack, acmePack),
				workspace:         workspaceMergeData,
				site:              siteMergeData,
			},
			[]string{
				"/workspace/zach/foo/test/componentpacks/uesio/io/12341111111/main/runtime.js",
				"/workspace/zach/foo/test/componentpacks/acme/stuff/1234577777/main/runtime.js",
				"/workspace/zach/foo/test/componentpacks/zach/foo/1234500005/main/runtime.js",
				"/workspace/zach/foo/test/componentpacks/zach/foo/1234599999/other/runtime.js",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := getComponentPackURLs(tt.args.componentPackDeps, tt.args.workspace, tt.args.site)
			sort.Strings(actual)
			want := tt.want
			sort.Strings(want)
			assert.Equalf(t, want, actual, "getComponentPackURLs(%v, %v, %v)", tt.args.componentPackDeps, tt.args.workspace, tt.args.site)
		})
	}
}
