package config

import "github.com/thecloudmasters/clio/pkg/localbundlestore"

func GetApp() (string, error) {

	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef("", "", nil, nil)
	if err != nil {
		return "", err
	}

	return def.Name, nil

}
