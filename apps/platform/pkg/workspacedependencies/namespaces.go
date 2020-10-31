package workspacedependencies

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetValidNamespaces function
func GetValidNamespaces(session *sess.Session) (map[string]bool, error) {
	siteWorkspaceNamespace := session.GetWorkspaceApp()
	namespaces := map[string]bool{}
	bdc, err := datasource.GetBundleDependenciesForWorkspace(session.GetWorkspaceID(), session)
	if err != nil {
		return namespaces, err
	}
	for _, bd := range *bdc {
		name := bd.BundleName
		if err != nil {
			return namespaces, err
		}
		namespaces[name] = true
	}

	namespaces[siteWorkspaceNamespace] = true

	return namespaces, nil
}
