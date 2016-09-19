# Introduction

Manage back end pages are loaded by [OpenVeo](https://github.com/veo-labs/openveo-core).

As expected by OpenVeo, Manage defines a module **ov.manage**.
It also defines a module **ov.socketIO**.

# Modules

## Main module (**ov.manage**)

Manage main module defines the following routes :

- **/manage/** to access the devices/groups list page
- **/publish/group-detail/:videoId** to access the group detail page

**Nb:** Available services / filters defined in **ov.manage** and **ov.socketIO** modules are described in the [API](/api/back-end/modules/ov.manage.html).