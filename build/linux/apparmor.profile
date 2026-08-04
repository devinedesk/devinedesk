abi <abi/4.0>,
include <tunables/global>

profile devinedesk /opt/devinedesk/devinedesk flags=(unconfined) {
  userns,
  include if exists <local/devinedesk>
}
