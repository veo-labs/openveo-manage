# Introduction

Configuration files are all in user's directory under **~/.openveo/manage**

- **~/.openveo/manage/manageConf.json**
- **~/.openveo/manage/loggerConf.json**

**Nb :** You must restart OpenVeo servers after modifications.

# Configure the plugin

Open **~/.openveo/manage/manageConf.json**

```json
{
  "namespace": "/veobox" // The configured namespace for socket.io in order to initialize the dialog with encoders
}
```

# Configure the logger

Open **~/.openveo/manage/loggerConf.json**

```json
{
  "manage": { // Manage logger
    "fileName": "/tmp/openveo/logs/openveo-manage.log", // Path to log file
	"level": "info", // Log level
	"maxFileSize": 1048576, // Maximum log file size (in Bytes)
	"maxFiles": 2 // Maximum number of files archived
  }
}
```



**Nb :** You need to configure your encoders to be able to interact with the Manage plugin
