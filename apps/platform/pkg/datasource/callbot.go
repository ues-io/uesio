package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
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

// CreateBundle function
func (sa *StudioAPI) CreateBundle(app, workspace string) error {
	// Add in a workspace context here
	err := AddContextWorkspace(app, workspace, sa.session)
	if err != nil {
		return nil
	}

	// Load in all bundles for this app and sort by highest version
	var bundles meta.BundleCollection

	err = PlatformLoadWithOrder(&bundles, []adapt.LoadRequestOrder{
		{
			Field: "studio.major",
			Desc:  true,
		},
		{
			Field: "studio.minor",
			Desc:  true,
		},
		{
			Field: "studio.patch",
			Desc:  true,
		},
	}, []adapt.LoadRequestCondition{
		{
			Field: "studio.app",
			Value: app,
		},
	}, sa.session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	version := ""

	if len(bundles) == 0 {
		version = "v0.0.1"
	} else {
		version, err = bundles.GetItem(0).(*meta.Bundle).GetNextPatchVersionString()
		if err != nil {
			return err
		}
	}

	workspace, sourcebs, err := bundle.GetBundleStoreWithVersion(app, sa.session)
	if err != nil {
		return err
	}

	err = CreateBundle(app, workspace, version, "", sourcebs, sa.session)
	if err != nil {
		return err
	}

	return nil
}

//GetBundleLastVersion function
func (sa *StudioAPI) GetBundleLastVersion(app string) string {

	var bundles meta.BundleCollection

	err := PlatformLoadWithOrder(&bundles, []adapt.LoadRequestOrder{
		{
			Field: "studio.major",
			Desc:  true,
		},
		{
			Field: "studio.minor",
			Desc:  true,
		},
		{
			Field: "studio.patch",
			Desc:  true,
		},
	}, []adapt.LoadRequestCondition{
		{
			Field: "studio.app",
			Value: app,
		},
	}, sa.session.RemoveWorkspaceContext())
	if err != nil {
		return ""
	}

	version := bundles.GetItem(0).(*meta.Bundle).GetVersionString()
	return version
}
