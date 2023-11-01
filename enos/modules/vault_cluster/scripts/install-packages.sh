#!/bin/bash
# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: BUSL-1.1

set -ex -o pipefail

if [ "$PACKAGES" == "" ]
then
  echo "No dependencies to install."
  exit 0
fi

function retry {
  local retries=$1
  shift
  local count=0

  until "$@"; do
    exit=$?
    wait=$((2 ** count))
    count=$((count + 1))
    if [ "$count" -lt "$retries" ]; then
      sleep "$wait"
    else
      exit "$exit"
    fi
  done

  return 0
}

# Wait for cloud-init to finish so it doesn't race with any of our package installations.
# Note: Amazon Linux 2 throws Python 2.7 errors when running `cloud-init status` as
# non-root user (known bug).
sudo cloud-init status --wait

echo "Installing Dependencies: $PACKAGES"

# Use the default package manager of the current Linux distro to install packages
if [ "$PACKAGE_MANAGER" = "apt" ]; then
  cd /tmp
  sudo apt update
  sudo apt install -y ${PACKAGES[@]}
elif [ "$PACKAGE_MANAGER" = "yum" ]; then
  cd /tmp
  sudo yum -y install ${PACKAGES[@]}
elif [ "$PACKAGE_MANAGER" = "zypper" ]; then
  # Note: SUSE distros use zypper. for SLES 12.5 SP5, some packages are not offered
  # in an official repo. If the first install step fails, we instead attempt to
  # register with PackageHub,SUSE's third party package marketplace, and then find
  # and install the package from there.
  sudo zypper install --no-confirm ${PACKAGES[@]} || ( sudo SUSEConnect -p PackageHub/$SLES_VERSION/$ARCH && sudo zypper install --no-confirm ${PACKAGES[@]})
  # For SUSE distros on arm64 architecture, we need to manually install these two
  # packages in order to install Vault RPM packages later.
  if [ "$ARCH" = "aarch64" ]; then
    sudo zypper install --no-confirm libcap-progs
    sudo zypper install --no-confirm openssl
  fi
else
  echo "No matching package manager provided."
  exit 1
fi
