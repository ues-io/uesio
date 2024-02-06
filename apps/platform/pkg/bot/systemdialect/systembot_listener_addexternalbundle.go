package systemdialect

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runAddExternalBundleListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID, err := getRequiredParameter(params, "app")
	if err != nil {
		return nil, err
	}

	version, err := getRequiredParameter(params, "version")
	if err != nil {
		return nil, err
	}

	if bundlestore.IsSystemBundle(appID) {
		return nil, exceptions.NewForbiddenException("cannot install a bundle for a system app")
	}

	if !session.GetSitePermissions().HasNamedPermission("uesio/studio.workspace_admin") {
		return nil, exceptions.NewForbiddenException("you must be a workspace admin to install bundles")
	}

	bundleStoreDomain, err := configstore.GetValueFromKey("uesio/core.bundle_store_domain", session)
	if err != nil {
		return nil, err
	}

	newBundle, err := getBundleFromVersion(appID, version, "")
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://studio.%s/site/bundles/v1/retrieve/%s/%s", bundleStoreDomain, appID, version)

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

	err = createNewBundle(body, newBundle, params, connection, session)
	if err != nil {
		return nil, err
	}

	return nil, nil

}

func getBundleFromVersion(namespace, version, description string) (*meta.Bundle, error) {

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
