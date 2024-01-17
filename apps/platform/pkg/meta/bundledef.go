package meta

import "github.com/thecloudmasters/uesio/pkg/env"

type BundleDefDep struct {
	Version    string `yaml:"version,omitempty" json:"version"`
	Repository string `yaml:"repo,omitempty" json:"repo"`
}

func (bdd *BundleDefDep) GetRepository() string {
	if bdd.Repository != "" {
		return bdd.Repository
	}
	bdd.Repository = env.GetPrimaryDomain()
	return bdd.Repository
}

type AppSettings struct {
	LoginRoute    string `yaml:"loginRoute,omitempty" json:"uesio/studio.loginroute"`
	SignupRoute   string `yaml:"signupRoute,omitempty" json:"uesio/studio.signuproute"`
	HomeRoute     string `yaml:"homeRoute,omitempty" json:"uesio/studio.homeroute"`
	DefaultTheme  string `yaml:"defaultTheme,omitempty" json:"uesio/studio.defaulttheme"`
	PublicProfile string `yaml:"publicProfile,omitempty" json:"uesio/studio.publicprofile"`
	Favicon       string `yaml:"favicon,omitempty" json:"uesio/studio.favicon"`
}

type BundleDef struct {
	Name         string `yaml:"name"`
	AppSettings  `yaml:",inline"`
	Dependencies BundleDefDependencyMap `yaml:"dependencies,omitempty"`
	Licenses     map[string]*License    `yaml:"-"`
}

type BundleDefDependencyMap map[string]BundleDefDep
