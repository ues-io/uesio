package config

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/cli/pkg/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
)

func GetApp() (string, error) {

	sbs := &localbundlestore.LocalBundleStore{}
	conn := sbs.GetConnection(bundlestore.ConnectionOptions{})

	def, err := conn.GetBundleDef(context.Background())
	if err != nil {
		return "", err
	}

	return def.Name, nil

}

func GetVersion(namespace string) (string, error) {
	sbs := &localbundlestore.LocalBundleStore{}
	conn := sbs.GetConnection(bundlestore.ConnectionOptions{})

	def, err := conn.GetBundleDef(context.Background())
	if err != nil {
		return "", err
	}

	versionInfo, ok := def.Dependencies[namespace]
	if !ok {
		return "", fmt.Errorf("that namespace is not installed: %s", namespace)
	}

	return versionInfo.Version, nil
}
