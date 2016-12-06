# Introduction

Manage back end pages are loaded by [OpenVeo](https://github.com/veo-labs/openveo-core).

As expected by OpenVeo, Manage defines a module **ov.manage**.
It also defines a module **ov.manage.socketIO**.

# Modules

## Main module (**ov.manage**)

Manage main module defines the following routes :

- **/manage/** to display the list of groups and devices
- **/manage/group-detail/:id** to display the content of a group

**Nb:** Available services / filters defined in **ov.manage** and **ov.manage.socketIO** modules are described in the [API](/api/back-end/modules/ov.manage.html).