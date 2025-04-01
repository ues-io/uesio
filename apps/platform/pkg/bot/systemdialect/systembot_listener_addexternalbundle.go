package systemdialect

import (
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runAddExternalBundleListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID, err := param.GetRequiredString(params, "app")
	if err != nil {
		return nil, err
	}

	version, err := param.GetRequiredString(params, "version")
	if err != nil {
		return nil, err
	}

	if bundlestore.IsSystemBundle(appID) {
		return nil, exceptions.NewForbiddenException("cannot install a bundle for a system app")
	}

	if !session.GetSitePermissions().HasNamedPermission(constant.WorkspaceAdminPerm) {
		return nil, exceptions.NewForbiddenException("you must be a workspace admin to install bundles")
	}

	bundleStoreBaseUrl, err := configstore.GetValue("uesio/studio.external_bundle_store_base_url", session)
	if err != nil {
		return nil, err
	}

	newBundle, err := getBundleFromVersion(appID, version)
	if err != nil {
		return nil, err
	}

	url, err := url.JoinPath(bundleStoreBaseUrl, "site/bundles/v1/retrieve", appID, version)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	httpResp, err := httpClient.Get().Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	// Read the zip file content
	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, err
	}

	err = deploy.CreateBundleFromData(body, newBundle, connection, session)
	if err != nil {
		return nil, err
	}

	return nil, nil

}

func getBundleFromVersion(namespace, version string) (*meta.Bundle, error) {

	major, minor, patch, err := meta.ParseVersionString(version)
	if err != nil {
		return nil, err
	}

	majorInt, err := strconv.Atoi(major)
	if err != nil {
		return nil, errors.New("Invalid major version string: " + major)
	}

	minorInt, err := strconv.Atoi(minor)
	if err != nil {
		return nil, errors.New("Invalid minor version string: " + minor)
	}

	patchInt, err := strconv.Atoi(patch)
	if err != nil {
		return nil, errors.New("Invalid patch version string: " + patch)
	}

	newBundle, err := meta.NewBundle(namespace, majorInt, minorInt, patchInt, "")
	if err != nil {
		return nil, err
	}

	return newBundle, nil

}
