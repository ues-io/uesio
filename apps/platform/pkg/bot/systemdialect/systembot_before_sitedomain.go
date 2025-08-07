package systemdialect

import (
	"context"
	"fmt"
	"net"
	"regexp"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"golang.org/x/net/idna"
)

// RFC 1035/1123-compliant regex for domain names (no underscores, no leading/trailing hyphens)
var domainRegex = regexp.MustCompile(`^(?i)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$`)

func runDomainBeforeSaveSiteBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	err := validateDomains(request)
	if err != nil {
		return err
	}
	return nil
}

type domainDetails struct {
	domain     string
	domainType string
}

func validateDomains(request *wire.SaveOp) error {
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
		if err := isValidDomain(domain); err != nil {
			return fmt.Errorf("invalid domain '%s': %w", domain.domain, err)
		}
	}
	return nil
}

// validates that the input string is a valid domain name according to RFC 1035/1123.
func isValidDomain(details domainDetails) error {
	domain := details.domain
	domainType := details.domainType

	// A colon is not a valid character in a domain name so safe to reject any input that contains a
	// colon since we do not accept ports, url schemes, etc.
	if strings.Contains(domain, ":") {
		return fmt.Errorf("domain must not contain a colon, port, or scheme: %s", domain)
	}

	// convert Unicode hostname to ASCII (Punycode) since its user text input
	asciiHost, err := idna.ToASCII(domain)
	if err != nil {
		return fmt.Errorf("failed to convert domain to ASCII: %w", err)
	}

	if net.ParseIP(asciiHost) != nil {
		return fmt.Errorf("domain cannot be an IP address: %s", domain)
	}

	if len(asciiHost) > 253 {
		return fmt.Errorf("domain too long: %s", domain)
	}

	if !domainRegex.MatchString(asciiHost) {
		return fmt.Errorf("invalid domain format: %s", domain)
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
		return fmt.Errorf("unknown domain type '%s' for domain '%s'", domainType, domain)
	}

	for _, label := range labels {
		if len(label) == 0 {
			return fmt.Errorf("domain contains empty label: %s", domain)
		}
		if len(label) > 63 {
			return fmt.Errorf("domain label too long: %s", label)
		}
		if strings.HasPrefix(label, "-") || strings.HasSuffix(label, "-") {
			return fmt.Errorf("domain label cannot start or end with hyphen: %s", label)
		}
	}

	return nil
}
