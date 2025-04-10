package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/env"
)

func TestParseHost(t *testing.T) {

	defaultPrimaryDomain := "ues.io"

	type testCase struct {
		name                string
		description         string
		host                string
		expected_domainType string
		expected_domain     string
		expected_subdomain  string
		primary_domain      string
	}

	var tests = []testCase{
		{
			"Scenario A",
			"Sub-Domain with Port",
			"studio.ues.io:3000",
			"subdomain",
			"ues.io:3000",
			"studio",
			defaultPrimaryDomain,
		},
		{
			"Scenario B",
			"Domain with Port",
			"uesio-dev.com:3000",
			"domain",
			"uesio-dev.com:3000",
			"",
			defaultPrimaryDomain,
		},
		{
			"Scenario C",
			"Domain with WWW. & Port",
			"www.thecloudmasters.com:3000",
			"domain",
			"www.thecloudmasters.com:3000",
			"",
			defaultPrimaryDomain,
		},
		{
			"Scenario D",
			"Sub-Domain no Port",
			"studio.ues.io",
			"subdomain",
			"ues.io",
			"studio",
			defaultPrimaryDomain,
		},
		{
			"Scenario E",
			"Domain no Port",
			"uesio-dev.com",
			"domain",
			"uesio-dev.com",
			"",
			defaultPrimaryDomain,
		},
		{
			"Scenario F",
			"Domain with WWW. and no Port",
			"www.thecloudmasters.com",
			"domain",
			"www.thecloudmasters.com",
			"",
			defaultPrimaryDomain,
		},
		{
			"Scenario G",
			"Scenario with www, port and subdomain",
			"www.hello.site.com",
			"domain",
			"www.hello.site.com",
			"",
			defaultPrimaryDomain,
		},
		{
			"Scenario I",
			"Scenario with multi-segment subdomain and non-localhost",
			"foo.bar.ues.io",
			"subdomain",
			"ues.io",
			"foo.bar",
			defaultPrimaryDomain,
		},
		{
			"Scenario J",
			"Scenario with localhost domain",
			"localhost",
			"domain",
			"localhost",
			"",
			"localhost",
		},
		{
			"Scenario K",
			"Scenario with single subdomain & localhost",
			"studio.localhost",
			"subdomain",
			"localhost",
			"studio",
			"localhost",
		},
		{
			"Scenario L",
			"Scenario with single subdomain and multi-segment localhost primary domain",
			"studio.uesio.localhost",
			"subdomain",
			"uesio.localhost",
			"studio",
			"uesio.localhost",
		},
		{
			"Scenario M",
			"Scenario with multi-segment subdomain & multi-segment localhost primary domain",
			"foo.bar.uesio.localhost",
			"subdomain",
			"uesio.localhost",
			"foo.bar",
			"uesio.localhost",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			env.SetPrimaryDomain(tc.primary_domain)
			domainType, domain, subdomain, _, err := parseHost(tc.host)
			assert.Nil(t, err)
			assert.Equal(t, domainType, tc.expected_domainType)
			assert.Equal(t, domain, tc.expected_domain)
			assert.Equal(t, subdomain, tc.expected_subdomain)
		})
	}
}
