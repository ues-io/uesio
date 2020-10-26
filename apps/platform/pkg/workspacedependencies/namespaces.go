package workspacedependencies

import (
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// GetValidNamespaces function
func GetValidNamespaces(site *metadata.Site, sess *session.Session) (map[string]bool, error) {
	siteWorkspaceNamespace := site.GetWorkspaceApp()
	namespaces := map[string]bool{}
	bdc, err := datasource.GetBundleDependenciesForWorkspace(site.GetWorkspaceID(), site, sess)
	if err != nil {
		return namespaces, err
	}
	for _, bd := range *bdc {
		name, _, err := bd.GetNameAndVersion()
		if err != nil {
			return namespaces, err
		}
		namespaces[name] = true
	}

	namespaces[siteWorkspaceNamespace] = true

	return namespaces, nil
}
