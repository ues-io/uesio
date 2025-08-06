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

func validateDomains(request *wire.SaveOp) error {
	domains := make([]string, 0, len(request.Inserts)+len(request.Updates))
	getDomain := func(change *wire.ChangeItem) error {
		domain, err := change.GetFieldAsString("uesio/studio.domain")
		if err != nil {
			return err
		}
		domains = append(domains, domain)
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
			return fmt.Errorf("invalid domain '%s': %w", domain, err)
		}
	}
	return nil
}

// validates that the input string is a valid domain name according to RFC 1035/1123.
func isValidDomain(input string) error {

	// A colon is not a valid character in a domain name so safe to reject any input that contains a
	// colon since we do not accept ports, url schemes, etc.
	if strings.Contains(input, ":") {
		return fmt.Errorf("domain must not contain a colon, port, or scheme: %s", input)
	}

	// convert Unicode hostname to ASCII (Punycode) since its user text input
	asciiHost, err := idna.ToASCII(input)
	if err != nil {
		return fmt.Errorf("failed to convert domain to ASCII: %w", err)
	}

	if net.ParseIP(asciiHost) != nil {
		return fmt.Errorf("domain cannot be an IP address: %s", input)
	}

	if len(asciiHost) > 253 {
		return fmt.Errorf("domain too long: %s", input)
	}

	if !domainRegex.MatchString(asciiHost) {
		return fmt.Errorf("invalid domain format: %s", input)
	}

	// santity checks for each label ensuring that there are at least two of them
	labels := strings.Split(asciiHost, ".")
	if len(labels) < 2 {
		return fmt.Errorf("domain must have at least two labels (e.g., 'example.com'): %s", input)
	}

	for _, label := range labels {
		if len(label) == 0 {
			return fmt.Errorf("domain contains empty label: %s", input)
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
