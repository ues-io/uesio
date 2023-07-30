package meta

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var route1 = strings.TrimPrefix(`
name: myroute
path: mypath
view: myview
theme: mytheme
`, "\n")

var route2 = strings.TrimPrefix(`
name: myroute
path: mypath
view: myview
`, "\n")

var route3 = strings.TrimPrefix(`
name: myroute
path: mypath
view: this/app.myview
`, "\n")

var route4 = strings.TrimPrefix(`
name: myroute
path: mypath
view: my/namespace.myview
`, "\n")

func TestRouteUnmarshal(t *testing.T) {

	type testCase struct {
		name        string
		description string
		yamlString  string
		initial     *Route
		final       *Route
	}

	var tests = []testCase{
		{
			"unlocalize",
			"Make sure the view and theme references are unlocalized",
			route1,
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
			},
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
			route2,
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
			},
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
			route2,
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
			},
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
			route2,
			&Route{
				BundleableBase: BundleableBase{
					Name:      "myroute",
					Namespace: "my/namespace",
				},
			},
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
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			err := yaml.Unmarshal([]byte(tc.yamlString), tc.initial)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}
			assert.Equal(t, tc.initial, tc.final)
		})
	}
}

func TestRouteMarshal(t *testing.T) {

	type testCase struct {
		name           string
		description    string
		initial        *Route
		expectedString string
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
			route1,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			result, err := yaml.Marshal(tc.initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.expectedString, string(result))
		})
	}

}
