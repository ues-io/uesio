package routing

import (
	"bytes"
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
	"testing"
)

const gridWithChildren = `uesio:io.grid
`

func Test_getComponentAreaDeps(t *testing.T) {

	session := sess.New(&meta.User{
		FirstName: "System",
		LastName:  "User",
		Profile:   "uesio/studio.standard",
		Username:  "system",
	}, &meta.Site{
		Name: "prod",
		Bundle: &meta.Bundle{
			Major: 0,
			Minor: 0,
			Patch: 1,
		},
		App: &meta.App{
			FullName: "uesio/studio",
			Name:     "studio",
		},
	})
	tests := []struct {
		name                 string
		yaml                 string
		wantComponentsLoaded []string
	}{
		{
			"process grid subcomponents",
			gridWithChildren,
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			yamlNode := &yaml.Node{}
			depMap := &ViewDepMap{}
			buff := bytes.NewBuffer([]byte(tt.yaml))
			err := yaml.NewDecoder(buff).Decode(yamlNode)
			if err != nil {
				t.Errorf("Unexpected error %s", err.Error())
				return
			}
			err = getComponentAreaDeps(yamlNode, depMap, session)
			if err != nil {
				t.Errorf("Unexpected error %s", err.Error())
			}
			// Verify that the expected components are loaded
			assert.Equal(t, tt.wantComponentsLoaded, goutils.MapKeys(depMap.Components))
		})
	}
}
