package print

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/routing"
)

func PrintUser(user *routing.UserMergeData) {
	fmt.Println(user.FirstName + " " + user.LastName + " " + user.Profile)
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
