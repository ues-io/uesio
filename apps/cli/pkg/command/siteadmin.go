package command

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/config/siteadmin"
)

func SiteAdmin(siteName string) error {

	if siteName == "" {
		sitePrompt, err := siteadmin.SetSiteAdminPrompt("")
		if err != nil {
			return err
		}
		siteName = sitePrompt
	}

	err := siteadmin.SetSiteAdmin(siteName)
	if err != nil {
		return err
	}

	fmt.Printf("Active site updated to: %s\n", siteName)

	return nil
}
