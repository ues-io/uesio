package systemdialect

import (
	"context"
	"fmt"
	"net"
	"regexp"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"golang.org/x/net/idna"
)

// RFC 1035/1123-compliant regex for domain names (no underscores, no leading/trailing hyphens)
var domainRegex = regexp.MustCompile(`^(?i)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$`)

func runDomainBeforeSaveSiteBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	canCreateDomains, err := canCreateDomains(ctx, session)
	if err != nil {
		return fmt.Errorf("failed to determine create domain permission: %w", err)
	}
	err = validateDomains(request, canCreateDomains)
	if err != nil {
		return err
	}
	return nil
}

type domainDetails struct {
	domain     string
	domainType string
}

func validateDomains(request *wire.SaveOp, canCreateDomains bool) error {
	domains := make([]domainDetails, 0, len(request.Inserts)+len(request.Updates))
	getDomain := func(change *wire.ChangeItem) error {
		domain, err := requireValue(change, "uesio/studio.domain")
		if err != nil {
			return err
		}
		domainType, err := requireValue(change, "uesio/studio.type")
		if err != nil {
			return err
		}
		domains = append(domains, domainDetails{domain, domainType})
		return nil
	}
	err := request.LoopInserts(getDomain)
	if err != nil {
		return err
	}
	err = request.LoopUpdates(getDomain)
	if err != nil {
		return err
	}
	for _, domain := range domains {
		if err := isValidDomain(domain, canCreateDomains); err != nil {
			return err
		}
	}
	return nil
}

func canCreateDomains(ctx context.Context, session *sess.Session) (bool, error) {
	flag, err := featureflagstore.GetFeatureFlag(ctx, "uesio/studio.manage_domains", session, session.GetContextUser().ID)
	if err != nil {
		return false, err
	}
	if flag.Value != nil {
		if val, ok := flag.Value.(bool); ok {
			return val, nil
		}
	}
	// if we don't have a value or its not a boolean, default to false
	return false, nil
}

// validates that the input string is a valid domain name according to RFC 1035/1123.
func isValidDomain(details domainDetails, canCreateDomains bool) error {
	domain := details.domain
	domainType := details.domainType

	if domainType != "subdomain" && domainType != "domain" {
		return fmt.Errorf("unknown domain type for (sub)domain '%s': %s", domain, domainType)
	}

	if domainType == "domain" && !canCreateDomains {
		return fmt.Errorf("you do not have permission to create domains: %s", domain)
	}

	// A colon is not a valid character in a domain name so safe to reject any input that contains a
	// colon since we do not accept ports, url schemes, etc.
	if strings.Contains(domain, ":") {
		return fmt.Errorf("%s must not contain a colon, port, or scheme: %s", domainType, domain)
	}

	// convert Unicode hostname to ASCII (Punycode) since its user text input
	asciiHost, err := idna.ToASCII(domain)
	if err != nil {
		return fmt.Errorf("failed to convert %s '%s' to ASCII: %w", domainType, domain, err)
	}

	if net.ParseIP(asciiHost) != nil {
		return fmt.Errorf("%s cannot be an IP address: %s", domainType, domain)
	}

	if len(asciiHost) > 253 {
		return fmt.Errorf("%s must be less than or equal to 253 characters in length: %s", domainType, domain)
	}

	if !domainRegex.MatchString(asciiHost) {
		return fmt.Errorf("invalid %s format: %s", domainType, domain)
	}

	// santity checks for each label ensuring that there are at least two of them
	labels := strings.Split(asciiHost, ".")
	switch domainType {
	case "subdomain":
		if len(labels) < 1 {
			return fmt.Errorf("a subdomain must have one label (e.g., 'mysubdomain'): %s", domain)
		}
		// Wildcard certs typically restrict to single label subdomains (e.g., *.example.com) and most cert providers will not issue multi-label wildcard certs. If a multi-label
		// subdomain is required, an explicit certificate, either for the subdomain explicitly or a wildcard for the top-most level of the subdomain, must be used which requires
		// infrastructure configuration depending on the hosting environment.
		if len(labels) > 1 {
			return fmt.Errorf("a subdomain can only contain one label (e.g., 'mysubdomain'), contact your administrator if you require a multi-label subdomain: %s", domain)
		}
	case "domain":
		if len(labels) < 2 {
			return fmt.Errorf("domain must have at least two labels (e.g., 'example.com'): %s", domain)
		}
	default:
		return fmt.Errorf("unknown domain type for (sub)domain '%s': %s", domain, domainType)
	}

	for _, label := range labels {
		if len(label) == 0 {
			return fmt.Errorf("%s contains empty label: %s", domainType, domain)
		}
		if len(label) > 63 {
			return fmt.Errorf("%s label must be less than or equal to 63 characters in length: %s", domainType, label)
		}
		if strings.HasPrefix(label, "-") || strings.HasSuffix(label, "-") {
			return fmt.Errorf("%s label cannot start or end with hyphen: %s", domainType, label)
		}
	}

	return nil
}
