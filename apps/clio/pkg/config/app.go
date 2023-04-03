package config

import (
	"errors"
	"github.com/thecloudmasters/clio/pkg/localbundlestore"
)

func GetApp() (string, error) {

	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef("", "", nil, nil)
	if err != nil {
		return "", err
	}

	return def.Name, nil

}

func GetVersion(namespace string) (string, error) {
	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef("", "", nil, nil)
	if err != nil {
		return "", err
	}

	versionInfo, ok := def.Dependencies[namespace]
	if !ok {
		return "", errors.New("That namespace is not installed: " + namespace)
	}

	return versionInfo.Version, nil
}
