package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func AddAllBuiltinFields(fields meta.BundleableGroup, session *sess.Session) error {
	err := bundle.LoadAll(fields, "uesio/core", meta.BundleConditions{
		"uesio/studio.collection": "uesio/core.common",
	}, session, nil)
	if err != nil {
		return errors.New("Could not load built-in fields: " + err.Error())
	}
	return nil
}
