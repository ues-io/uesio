package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var route_local_view_local_theme = trimYamlString(`
name: myroute
path: mypath
view: myview
theme: mytheme
`)

var route_local_view_no_theme = trimYamlString(`
name: myroute
path: mypath
view: myview
`)

var route_this_app_view_no_theme = trimYamlString(`
name: myroute
path: mypath
view: this/app.myview
`)

var route_fq_view_no_theme = trimYamlString(`
name: myroute
path: mypath
view: my/namespace.myview
`)

var route_redirect = trimYamlString(`
name: myroute
type: redirect
redirect: http://www.google.com
`)

func TestRouteUnmarshal(t *testing.T) {

	type testCase struct {
		name        string
		description string
		yamlString  string
		path        string
		namespace   string
		expected    *Route
	}

	var tests = []testCase{
		{
			"unlocalize",
			"Make sure the view and theme references are unlocalized",
			route_local_view_local_theme,
			"myroute.yaml",
			"my/namespace",
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
				Path:     "mypath",
				ViewRef:  "my/namespace.myview",
				ThemeRef: "my/namespace.mytheme",
			},
		},
		{
			"add default theme",
			"Make sure the default theme is added",
			route_local_view_no_theme,
			"myroute.yaml",
			"my/namespace",
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
				Path:     "mypath",
				ViewRef:  "my/namespace.myview",
				ThemeRef: "uesio/core.default",
			},
		},
		{
			"unlocalize this/app",
			"Make sure references with this/app are unlocalized",
			route_this_app_view_no_theme,
			"myroute.yaml",
			"my/namespace",
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
				Path:     "mypath",
				ViewRef:  "my/namespace.myview",
				ThemeRef: "uesio/core.default",
			},
		},
		{
			"unlocalize fully qualified namespace",
			"Make sure references with an actual namespace are unchanged",
			route_fq_view_no_theme,
			"myroute.yaml",
			"my/namespace",
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
				Path:     "mypath",
				ViewRef:  "my/namespace.myview",
				ThemeRef: "uesio/core.default",
			},
		},
		{
			"redirect route",
			"Make sure redirect route works",
			route_redirect,
			"myroute.yaml",
			"my/namespace",
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
				ThemeRef: "uesio/core.default",
				Redirect: "http://www.google.com",
				Type:     "redirect",
			},
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			initial := (&RouteCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}
			assert.Equal(t, initial, tc.expected)
		})
	}
}

func TestRouteMarshal(t *testing.T) {

	type testCase struct {
		name              string
		description       string
		initial           *Route
		expectedString    string
		expectedPath      string
		expectedNamespace string
	}

	var tests = []testCase{
		{
			"localize and default",
			"view and theme should be localized and default removed",
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
				Path:     "mypath",
				ViewRef:  "my/namespace.myview",
				ThemeRef: "my/namespace.mytheme",
			},
			route_local_view_local_theme,
			"myroute.yaml",
			"my/namespace",
		},
		{
			"redirect",
			"routes of type redirect should marshal correctly",
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
				Type:     "redirect",
				Redirect: "http://www.google.com",
			},
			route_redirect,
			"myroute.yaml",
			"my/namespace",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {

			result, err := yaml.Marshal(tc.initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.expectedString, string(result))
			assert.Equal(t, tc.expectedPath, tc.initial.GetPath())
			assert.Equal(t, tc.expectedNamespace, tc.initial.GetNamespace())
		})
	}

}

func TestRouteRoundTrip(t *testing.T) {
	type testCase struct {
		name        string
		description string
		path        string
		namespace   string
		yamlString  string
	}

	var tests = []testCase{
		{
			"roundtrip with local references",
			"",
			"myroute.yaml",
			"my/namespace",
			route_local_view_local_theme,
		},
		{
			"roundtrip with default",
			"",
			"myroute.yaml",
			"my/namespace",
			route_local_view_no_theme,
		},
		{
			"roundtrip redirect",
			"",
			"myroute.yaml",
			"my/namespace",
			route_redirect,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			initial := (&RouteCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}

			result, err := yaml.Marshal(initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.yamlString, string(result))
		})
	}
}
