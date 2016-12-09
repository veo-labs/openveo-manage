# Introduction

OpenVeo Manage defines its own Web Service endpoints. Web Service authentication is documented in [OpenVeo](https://github.com/veo-labs/openveo-core) project.

# Endpoints

## Devices

Get all devices.

    GET WEB_SERVICE_URL/manage/devices

HTTP Status Code | Details
---- | ----
200 | Got the list of devices (even if the list is empty)
500 | An error occured on the server side
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "entities" : [
    {
      "id" : "08:46:56:db:a0:f3",
      "name" : "Veobox 237",
      "state" : "accepted",
      "history" : [],
      "schedules" : [],
      "group": "B1x2yr5Fge"
    },
    {
      "id" : "32:84:12:db:f0:f3",
      "name" : "Veobox 55",
      "state" : "accepted",
      "history" : [],
      "schedules" : [],
      "group": "B1x2yr5Fge"
    }
  ]
}
```

---

Get information about a device.

    GET WEB_SERVICE_URL/manage/devices/{device_id}

Name | Type | Required | Default | Details
---- | ---- | ---- | ---- | ----
device_id | String | Yes | - | The id of the device to fetch

HTTP Status Code | Details
---- | ----
200 | Got the device
500 | An error occured on the server side
400 | The id of the device is missing
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "entity" : {
    "id" : "08:46:56:db:a0:f3",
    "name" : "Veobox 237",
    "state" : "accepted",
    "history" : [],
    "schedules" : []
  }
}
```

---

Add device information.

    PUT WEB_SERVICE_URL/manage/devices

HTTP Status Code | Details
---- | ----
200 | The device has been added
500 | An error occured on the server side
400 | Wrong PUT parameters
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "entity" : {
    "id" : "c2:ef:12:dd:f0:55",
    "name" : "New Veobox",
    ...
  }
}
```

---

Update a device.

    POST WEB_SERVICE_URL/manage/devices/{device_id}

HTTP Status Code | Details
---- | ----
200 | The device has been updated
500 | An error occured on the server side
400 | Missing the device id
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "error": null,
  "status": "ok"
}
```

---

Delete a device.

    DELETE WEB_SERVICE_URL/manage/devices/{device_id}

HTTP Status Code | Details
---- | ----
200 | The device has been deleted
500 | An error occured on the server side
400 | Missing the device id
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "error": null,
  "status": "ok"
}
```

## Groups

Get custom groups.

    GET WEB_SERVICE_URL/manage/groups

HTTP Status Code | Details
---- | ----
200 | Got the list of groups (even if the list is empty)
500 | An error occured on the server side
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "entities": [
    {
      "id" : "HJlyu7TH7e",
      "name" : "groupe 1",
      "schedules" : [],
      "history" : [ 
        {
            "id" : "H1JdX6B7g",
            "date" : ISODate("2016-12-07T17:14:14.593Z"),
            "message" : {
                "data" : "MANAGE.HISTORY.CREATE_GROUP",
                "params" : {}
            }
        }, 
        {
            "id" : "S1fy_maHXl",
            "date" : ISODate("2016-12-07T17:14:14.626Z"),
            "message" : {
                "data" : "MANAGE.HISTORY.ADD_DEVICE_TO_GROUP",
                "params" : {
                    "name" : "2",
                    "groupName" : "MANAGE.GROUP.DEFAULT_NAME"
                }
            }
        }, 
        {
            "id" : "S1NJ_Qarmg",
            "date" : ISODate("2016-12-07T17:14:14.632Z"),
            "message" : {
                "data" : "MANAGE.HISTORY.ADD_DEVICE_TO_GROUP",
                "params" : {
                    "name" : "1",
                    "groupName" : "MANAGE.GROUP.DEFAULT_NAME"
                }
            }
        }
      ]
    }
  ]
}
```

---

Get information about a group.

    GET WEB_SERVICE_URL/manage/groups/{group_id}

Name | Type | Required | Default | Details
---- | ---- | ---- | ---- | ----
group_id | String | Yes | - | The id of the group to fetch

HTTP Status Code | Details
---- | ----
200 | Got the group
500 | An error occured on the server side
400 | The id of the group is missing
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "entity": {
      "id" : "HJlyu7TH7e",
      "name" : "groupe 1",
      "schedules" : [],
      "history" : [ 
        {
            "id" : "H1JdX6B7g",
            "date" : ISODate("2016-12-07T17:14:14.593Z"),
            "message" : {
                "data" : "MANAGE.HISTORY.CREATE_GROUP",
                "params" : {}
            }
        }, 
        {
            "id" : "S1fy_maHXl",
            "date" : ISODate("2016-12-07T17:14:14.626Z"),
            "message" : {
                "data" : "MANAGE.HISTORY.ADD_DEVICE_TO_GROUP",
                "params" : {
                    "name" : "2",
                    "groupName" : "MANAGE.GROUP.DEFAULT_NAME"
                }
            }
        }, 
        {
            "id" : "S1NJ_Qarmg",
            "date" : ISODate("2016-12-07T17:14:14.632Z"),
            "message" : {
                "data" : "MANAGE.HISTORY.ADD_DEVICE_TO_GROUP",
                "params" : {
                    "name" : "1",
                    "groupName" : "MANAGE.GROUP.DEFAULT_NAME"
                }
            }
        }
      ]
  }
}
```
---

Add a group.

    PUT WEB_SERVICE_URL/manage/groups

HTTP Status Code | Details
---- | ----
200 | The group has been added
500 | An error occured on the server side
400 | Wrong PUT parameters
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "entity" : {
    "id" : "HJlyu7TH7e", // Id of the group
    "name" : "New group", // Group name
    ...
  }
}
```

---

Update a group.

    POST WEB_SERVICE_URL/manage/groups/{group_id}

HTTP Status Code | Details
---- | ----
200 | The group has been updated
500 | An error occured on the server side
400 | Missing the group id
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "error": null,
  "status": "ok"
}
```

---

Delete a group.

    DELETE WEB_SERVICE_URL/manage/groups/{group_id}

HTTP Status Code | Details
---- | ----
200 | The group has been deleted
500 | An error occured on the server side
400 | Missing the group id
401 | Authentication to the web service failed
403 | Authorization forbidden for this end point

```json
{
  "error": null,
  "status": "ok"
}
```