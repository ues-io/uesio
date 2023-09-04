package meta

import (
	"errors"
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

var route_redirect_error = trimYamlString(`
name: myroute
type: redirect
`)

func TestRouteUnmarshal(t *testing.T) {

	type testCase struct {
		name        string
		description string
		yamlString  string
		path        string
		namespace   string
		expected    *Route
		expectedErr error
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
			nil,
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
			nil,
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
			nil,
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
			nil,
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
			nil,
		},
		{
			"redirect route error",
			"Fail if we're missing the redirect property",
			route_redirect_error,
			"myroute.yaml",
			"my/namespace",
			nil,
			errors.New("redirect property is required for routes of type 'redirect'"),
		},
		{
			"route bad name",
			"Fail if our name doesn't match our file name",
			route_local_view_local_theme,
			"myroute_badname.yaml",
			"my/namespace",
			nil,
			errors.New("Metadata name does not match filename: myroute, myroute_badname"),
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			initial := (&RouteCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if tc.expectedErr != nil {
				assert.Equal(t, tc.expectedErr, err)
				return
			}
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
