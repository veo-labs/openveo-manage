YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "GroupFactory",
        "ManageDeviceFactory",
        "ManageFactory",
        "ManageManageableFactory",
        "ManageSocketService",
        "ovManageSortTable"
    ],
    "modules": [
        "ov.manage",
        "ov.manage.socketIO"
    ],
    "allModules": [
        {
            "displayName": "ov.manage",
            "name": "ov.manage",
            "description": "Defines components responsible of the manage plugin back end pages.\n\nIt creates two back end pages. One to display the list of devices and groups, the other\none to display the list of devices inside a group."
        },
        {
            "displayName": "ov.manage.socketIO",
            "name": "ov.manage.socketIO",
            "description": "Defines the ov.manage.socketIO module to build a socket.io client."
        }
    ],
    "elements": []
} };
});