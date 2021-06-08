# Installation

To install OpenVeo Manage you first need to install OpenVeo Core if not already done.


# OpenVeo Core

## Install @openveo/core package

    # Move to your workspace directory
    cd /WORKSPACE_PATH

    # Create directory for OpenVeo core
    mkdir openveo-core

    # Install OpenVeo core in this directory
    # See OpenVeo core documentation for more information

Your workspace should look like this:

```
.
├── openveo-core
```

## Create NPM links for openveo-api and openveo-test

In a classical NPM project @openveo/manage package should be installed in /WORKSPACE_PATH/openveo-core/node_modules/@openveo/manage. For development, the first thing which comes to mind is to create a clone of the OpenVeo Manage project inside this repository. But doing this will prevent npm install from working and will create a complicated development architecture with the risk to erase the repository at any time.

We use [NPM links](https://docs.npmjs.com/cli/link) to deal with this problem and store OpenVeo Manage inside /WORKSPACE_PATH/openveo-manage. But there is a catch. OpenVeo Manage need both @openveo/api and @openveo/test of the core. As packages @openveo/manage and @openveo/core are installed in two different locations, package @openveo/manage won't find @openveo/api nor @openveo/test in its Node.JS path. That's why we have to create NPM links for both @openveo/api and @openveo/test and refer to it inside @openveo/manage.

    # Create a link for @openveo/api
    cd /WORKSPACE_PATH/openveo-core/node_modules/@openveo/api
    npm link

    # Create a link for @openveo/test
    cd /WORKSPACE_PATH/openveo-core/node_modules/@openveo/test
    npm link

# OpenVeo Manage

## Clone project from git

    # Clone project into workspace
    cd /WORKSPACE_PATH/
    git clone git@github.com:veo-labs/openveo-manage.git

Your workspace should look like this:

```
.
├── openveo-core
├── openveo-manage
```

## Install project's dependencies

    cd /WORKSPACE_PATH/openveo-manage
    npm ci

## Link openveo-api and openveo-test

When installing OpenVeo Core we created NPM links for @openveo/api and @openveo/test. We can now refer to this links.

    # Install dependencies @openveo/api and @openveo/test using NPM links
    cd /WORKSPACE_PATH/openveo-manage
    npm link @openveo/api @openveo/test

# Install plugin

To be able to install @openveo/manage in @openveo/core we create an NPM link of @openveo/manage and refer to it in the core.

## Create an NPM link

    # Create a link for @openveo/manage
    cd /WORKSPACE_PATH/openveo-manage
    npm link

## Link project to core

    # Install dependency @openveo/manage using NPM links
    cd /WORKSPACE_PATH/openveo-core
    npm link @openveo/manage
