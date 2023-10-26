package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var sanity = `
name: mypermset
`

var withCollectionScalarTrue = `
name: mypermset
collections:
  uesio/core.user: true
`

var withCollectionScalarFalse = `
name: mypermset
collections:
  uesio/core.user: false
`

var withCollectionBlank = `
name: mypermset
collections:
  uesio/core.user:
`

var withCollectionNull = `
name: mypermset
collections:
  uesio/core.user: null
`

func TestPermissionSetYaml(t *testing.T) {

	type testCase struct {
		yamlText    []byte
		name        string
		description string
		expect      *PermissionSet
	}

	var tests = []testCase{
		{
			[]byte(sanity),
			"mypermset",
			"sanity",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
			},
		},
		{
			[]byte(withCollectionScalarTrue),
			"mypermset",
			"with collection scalar true",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{
					"uesio/core.user": {
						Read:   true,
						Create: true,
						Edit:   true,
						Delete: true,
					},
				},
			},
		},
		{
			[]byte(withCollectionScalarFalse),
			"mypermset",
			"with collection scalar false",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{},
			},
		},
		{
			[]byte(withCollectionBlank),
			"mypermset",
			"with collection scalar blank",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{
					"uesio/core.user": {
						Read:   true,
						Create: true,
						Edit:   true,
						Delete: true,
					},
				},
			},
		},
		{
			[]byte(withCollectionNull),
			"mypermset",
			"with collection scalar null",
			&PermissionSet{
				BundleableBase: BundleableBase{
					Name: "mypermset",
				},
				CollectionRefs: CollectionPermissionMap{
					"uesio/core.user": {
						Read:   true,
						Create: true,
						Edit:   true,
						Delete: true,
					},
				},
			},
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			permSet := &PermissionSet{
				BundleableBase: BundleableBase{
					Name: tc.name,
				},
			}
			err := yaml.Unmarshal(tc.yamlText, permSet)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling yaml: %s", err.Error())
			}
			assert.Equal(t, permSet, tc.expect)
		})
	}
}

// Set all the default values on a flattened Permission Set.
// NOTE: DO NOT move this into PermissionSet class, otherwise we could accidentally
// break something and the tests would be broken too so we wouldn't notice.
func withExpectedDefaults(ps *PermissionSet) *PermissionSet {
	// THere is no equivalent of "Allow all named permissions"
	if ps.NamedRefs == nil {
		ps.NamedRefs = map[string]bool{}
	}
	if ps.BotRefs == nil && !ps.AllowAllBots {
		ps.BotRefs = map[string]bool{}
	}
	if ps.FileRefs == nil && !ps.AllowAllFiles {
		ps.FileRefs = map[string]bool{}
	}
	if ps.RouteRefs == nil && !ps.AllowAllRoutes {
		ps.RouteRefs = map[string]bool{}
	}
	if ps.ViewRefs == nil && !ps.AllowAllViews {
		ps.ViewRefs = map[string]bool{}
	}
	if ps.CollectionRefs == nil && !ps.AllowAllCollections {
		ps.CollectionRefs = CollectionPermissionMap{}
	}
	if ps.IntegrationActionRefs == nil && !ps.AllowAllIntegrationActions {
		ps.IntegrationActionRefs = IntegrationPermissionMap{}
	}
	return ps
}

func TestFlattenPermissions(t *testing.T) {
	tests := []struct {
		name  string
		input []PermissionSet
		want  *PermissionSet
	}{
		// BOT permission tests
		{
			"build default bot permissions",
			[]PermissionSet{},
			&PermissionSet{
				BotRefs:      map[string]bool{},
				AllowAllBots: false,
			},
		},
		{
			"flatten bot perms",
			[]PermissionSet{
				{
					AllowAllBots: false,
					BotRefs: map[string]bool{
						"uesio/core.foo": false,
						"uesio/core.bar": true,
					},
				},
				{
					AllowAllBots: false,
					BotRefs: map[string]bool{
						"uesio/core.foo": true,
						"uesio/core.bar": false,
						"uesio/core.baz": false,
					},
				},
			},
			&PermissionSet{
				BotRefs: map[string]bool{
					"uesio/core.foo": true,
					"uesio/core.bar": true,
					// Only the true values should be included in the flattened map
				},
				AllowAllBots: false,
			},
		},
		{
			"completely flatten bot perms if AllowAllBots is true for any",
			[]PermissionSet{
				{
					AllowAllBots: false,
					BotRefs: map[string]bool{
						"uesio/core.foo": false,
						"uesio/core.bar": true,
					},
				},
				{
					AllowAllBots: true,
					BotRefs: map[string]bool{
						"uesio/core.foo": true,
						"uesio/core.bar": false,
						"uesio/core.baz": false,
					},
				},
			},
			&PermissionSet{
				AllowAllBots: true,
			},
		},
		// Integration Action permissions
		{
			"build default Integration Action permissions",
			[]PermissionSet{},
			&PermissionSet{
				IntegrationActionRefs:      IntegrationPermissionMap{},
				AllowAllIntegrationActions: false,
			},
		},
		{
			"flatten Integration Action perms",
			[]PermissionSet{
				{
					IntegrationActionRefs: IntegrationPermissionMap{
						"uesio/core.foo": IntegrationPermission{
							AllowAll: true,
						},
						"uesio/core.bar": IntegrationPermission{
							ActionPerms: map[string]bool{
								"uesio/core.action1": false,
							},
						},
						"uesio/core.baz": IntegrationPermission{
							ActionPerms: map[string]bool{
								"uesio/core.action1": true,
								"uesio/core.action2": false,
							},
						},
					},
					AllowAllIntegrationActions: false,
				},
				{
					IntegrationActionRefs: IntegrationPermissionMap{
						"uesio/core.foo": IntegrationPermission{
							ActionPerms: map[string]bool{
								"uesio/core.action1": true,
								"uesio/core.action2": false,
							},
						},
						"uesio/core.bar": IntegrationPermission{
							ActionPerms: map[string]bool{
								"uesio/core.action1": true,
								"uesio/core.action2": false,
							},
						},
					},
					AllowAllIntegrationActions: false,
				},
			},
			&PermissionSet{
				IntegrationActionRefs: IntegrationPermissionMap{
					"uesio/core.foo": IntegrationPermission{
						AllowAll: true,
					},
					"uesio/core.bar": IntegrationPermission{
						AllowAll: false,
						ActionPerms: map[string]bool{
							"uesio/core.action1": true,
						},
					},
					"uesio/core.baz": IntegrationPermission{
						AllowAll: false,
						ActionPerms: map[string]bool{
							"uesio/core.action1": true,
							"uesio/core.action2": false,
						},
					},
				},
				AllowAllIntegrationActions: false,
			},
		},
		{
			"ignore Integration Actions if AllowAll is set",
			[]PermissionSet{
				{
					IntegrationActionRefs: IntegrationPermissionMap{
						"uesio/core.foo": IntegrationPermission{
							AllowAll: true,
						},
						"uesio/core.bar": IntegrationPermission{
							ActionPerms: map[string]bool{
								"uesio/core.action1": false,
							},
						},
						"uesio/core.baz": IntegrationPermission{
							ActionPerms: map[string]bool{
								"uesio/core.action1": true,
								"uesio/core.action2": false,
							},
						},
					},
					AllowAllIntegrationActions: false,
				},
				{
					AllowAllIntegrationActions: true,
				},
			},
			&PermissionSet{
				AllowAllIntegrationActions: true,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, withExpectedDefaults(tt.want), FlattenPermissions(tt.input), "FlattenPermissions(%v)", tt.input)
		})
	}
}
