# Adds local subdomains to /etc/hosts so that they resolve
all_hosts="studio.localhost docs.localhost tests.localhost"
ip_address="127.0.0.1"
host_entry="$ip_address $all_hosts"
if grep -q "$host_entry" /etc/hosts; then
    echo "Entry '$host_entry' already exists in /etc/hosts"
else
    echo "$host_entry" | sudo tee -a /etc/hosts > /dev/null
    echo "Entry '$host_entry' added to /etc/hosts"
fi