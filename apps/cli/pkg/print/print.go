package print

import (
	"fmt"
	"github.com/thecloudmasters/cli/pkg/auth"
)

func PrintUserSummary(user *auth.UserMergeData) string {
	return fmt.Sprintf("%s %s (%s)", user.FirstName, user.LastName, user.Profile)
}

func PrintUser(user *auth.UserMergeData) {
	fmt.Println(PrintUserSummary(user))
}

func PrintHost(host string) {
	if host == "" {
		fmt.Println("No Host Set")
		return
	}
	fmt.Println("Host: " + host)
}

func PrintWorkspace(workspace string) {
	if workspace == "" {
		fmt.Println("No Active Workspace Set")
		return
	}
	fmt.Println("Workspace: " + workspace)
}
