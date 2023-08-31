package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func addVersionContext(app, version string, session *sess.Session) error {

	bundleDef, err := bundle.GetVersionBundleDef(app, version, nil)
	if err != nil {
		return err
	}

	licenseMap, err := GetLicenses(app, nil)
	if err != nil {
		return err
	}
	bundleDef.Licenses = licenseMap

	session.SetVersionSession(sess.NewVersionSession(app, version, session.GetSiteUser(), bundleDef))

	return nil

}

func AddVersionContext(app, version string, session *sess.Session) (*sess.Session, error) {
	site := session.GetSite()
	perms := session.GetSitePermissions()

	// 1. Make sure we're in a site that can work with metadata
	if site.GetAppFullName() != "uesio/studio" {
		return nil, errors.New("this site does not allow working with versions")
	}
	// 2. we should have a profile that allows modifying workspaces
	if !perms.HasPermission(&meta.PermissionSet{
		NamedRefs: map[string]bool{
			"uesio/studio.workspace_admin": true,
		},
	}) {
		return nil, errors.New("your profile does not allow you to work with versions")
	}
	sessClone := session.RemoveWorkspaceContext()
	return sessClone, addVersionContext(app, version, sessClone)
}

func EnterVersionContext(app string, session *sess.Session) (*sess.Session, error) {
	// We don't need to enter into a version context for our own app
	if app == session.GetContextAppName() {
		return session, nil
	}

	version, err := bundle.GetVersion(app, session)
	if err != nil {
		return nil, err
	}
	sessClone := session.RemoveWorkspaceContext()
	return sessClone, addVersionContext(app, version, sessClone)
}
