package print

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
)

func PrintUserSummary(user *auth.UserMergeData) string {
	return fmt.Sprintf("%s %s (%s)", user.FirstName, user.LastName, user.Profile)
}

func PrintUser(user *auth.UserMergeData) {
	if user == nil {
		fmt.Println("No user set")
		return
	}
	fmt.Println(PrintUserSummary(user))
}

func PrintHost(host string) {
	if host == "" {
		fmt.Println("No host set")
		return
	}
	fmt.Println("Host: " + host)
}

func PrintWorkspace(workspaceName string) {
	if workspaceName == "" {
		fmt.Println("No active workspace set")
		return
	}
	fmt.Println("Workspace: " + workspaceName)
}
