#!/bin/bash

set -e

# Adds uesio subdomains to /etc/hosts for each specified domain
subdomains="studio docs tests"
local_addresses=("127.0.0.1" "::1")
script_name=$(basename "${BASH_SOURCE[0]:-$0}")
domains=()
add_exact="false"

# collect the domains
for domain in "$@"; do
    if [ "${domain}" = "-e" ]; then
        echo "Only the exact domain(s) specified will be added. Additional subdomains $(echo $subdomains | sed 's/ /\//g') will not be automatically added to each domain specified."
        add_exact="true"
    elif ! [[ "$domain" =~ ^([a-zA-Z0-9](-?[a-zA-Z0-9])*\.)+[a-zA-Z]{2,}$ ]]; then
        echo "Error: $domain is invalid. Domain names can only contain valid characters and must be at least two-parts (e.g., mysite.com)." >&2
        exit 1
    else
        domains+=("${domain}")
    fi
done

# automatically include UESIO_PRIMARY_DOMAIN if set and not blank
if ! [[ -z "${UESIO_PRIMARY_DOMAIN}" ]]; then
    echo "UESIO_PRIMARY_DOMAIN detected, will add default ${UESIO_PRIMARY_DOMAIN} subdomains to /etc/hosts."
    domains+=("${UESIO_PRIMARY_DOMAIN}")
fi

# Validate we have at least one domain
if [ ${#domains[@]} -eq 0 ]; then
    echo "No domains are required to be configured in local dns. If you change your UESIO_PRIMARY_DOMAIN, please run this script again." >&2
    echo "Usage: $script_name [domain...]" >&2
    exit 1
fi

# Deduplicate - support for Linux and macOS so can't use mapfile
domains=($(printf '%s\n' "${domains[@]}" | sort -u))

# Process each domain
for domain in "${domains[@]}"; do
    all_subdomains=""
    if ! [[ "${add_exact}" = "true" ]]; then
        for subdomain in $subdomains; do
            if [ -z "$all_subdomains" ]; then
                all_subdomains="$subdomain.$domain"
            else
                all_subdomains="$all_subdomains $subdomain.$domain"
            fi
        done
    fi
    for ip_address in "${local_addresses[@]}"; do
        host_entry="$ip_address $domain $all_subdomains"
        if grep -v '^[[:space:]]*#' /etc/hosts | grep -q "$host_entry"; then        
            echo "Entry $ip_address for domain $domain already exists in /etc/hosts"
        else
            echo "$host_entry" | sudo tee -a /etc/hosts > /dev/null
            echo "Entry $ip_address for domain $domain added to /etc/hosts"
        fi
    done
done