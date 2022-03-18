package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// CallBotAPI type
type CallBotAPI struct {
	session   *sess.Session
	Params    *ParamsAPI `bot:"params"`
	StudioAPI *StudioAPI `bot:"studio"`
}

// Save function
func (cba *CallBotAPI) Save(collection string, changes adapt.Collection) error {
	requests := []SaveRequest{
		{
			Collection: collection,
			Wire:       "apicallbot",
			Changes:    &changes,
		},
	}
	err := Save(requests, cba.session)
	if err != nil {
		return err
	}
	return HandleSaveRequestErrors(requests)
}

// StudioAPU type
type StudioAPI struct {
	session *sess.Session
}

//GetBundleLastVersion function
func (sa *StudioAPI) GetBundleLastVersion(app string) string {

	var bundles meta.BundleCollection

	err := PlatformLoad(
		&bundles,
		&PlatformLoadOptions{
			Orders: []adapt.LoadRequestOrder{
				{
					Field: "uesio/studio.major",
					Desc:  true,
				},
				{
					Field: "uesio/studio.minor",
					Desc:  true,
				},
				{
					Field: "uesio/studio.patch",
					Desc:  true,
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.app",
					Value: app,
				},
			},
		},
		sa.session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return ""
	}

	version := bundles.GetItem(0).(*meta.Bundle).GetVersionString()
	return version
}
