#!/bin/bash

set -e

# Adds uesio subdomains to /etc/hosts for each specified domain
subdomains="studio docs tests"
local_addresses=("127.0.0.1" "::1")
script_name=$(basename "${BASH_SOURCE[0]:-$0}")

# collect the domains
for domain in "$@"; do
    if [ "${domain}" = "-l" ]; then
        domains+=("localhost")        
    elif [ "${domain}" = "-p" ]; then
        if [[ -z "${UESIO_PRIMARY_DOMAIN}" ]]; then        
            echo "Error: UESIO_PRIMARY_DOMAIN is not set, please make sure its set."
            exit 1
        else 
            domains+=($UESIO_PRIMARY_DOMAIN)                
        fi
    elif [[ "${domain}" == "localhost" ]]; then
        echo "Error: Use the -l option to include localhost."
        exit 1
    elif ! [[ "$domain" =~ ^([a-zA-Z0-9](-?[a-zA-Z0-9])*\.)+[a-zA-Z]{2,}$ ]]; then
        echo "Error: $domain is invalid. Domain names can only contain valid characters and must be at least two-parts (e.g., mysite.com)."
        exit 1
    else
        domains+=("${domain}")
    fi
done

# Validate we have at least one domain
if [ ${#domains[@]} -eq 0 ]; then
    echo "Usage: $script_name [-l] [domain...]" >&2
    exit 1
fi

# Deduplicate - support for Linux and macOS so can't use mapfile
domains=($(printf '%s\n' "${domains[@]}" | sort -u))

# Process each domain
for domain in "${domains[@]}"; do
    all_subdomains=""
    for subdomain in $subdomains; do
        if [ -z "$all_subdomains" ]; then
            all_subdomains="$subdomain.$domain"
        else
            all_subdomains="$all_subdomains $subdomain.$domain"
        fi
    done
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