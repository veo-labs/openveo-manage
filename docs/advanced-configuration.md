# Introduction

Configuration files are all in user's directory under **~/.openveo/manage**

- **~/.openveo/manage/manageConf.json**

**Nb :** You must restart OpenVeo servers after modifications.

# Configure the plugin

Open **~/.openveo/manage/manageConf.json**

```json
{
  "devicesNamespace": "/devices", // The namespace for socket.io in order to initialize the dialog with encoders
  "browsersNamespace": "/browsers", // The namespace for socket.io in order to initialize the dialog with browsers
  "port": 3002, // The socket.io server port to listen,
  "frontalPort": 8081 // The socket.io frontal port to use by socket client
}
```

**Nb :** You need to configure your encoders to be able to interact with the Manage plugin

# Configure the logger

Open **~/.openveo/manage/loggerConf.json**

```json
{
  "fileName" : "/var/log/openveo-socket.log", // Path to log file
  "level" : "info", // Log level
  "maxFileSize" : 1048576, // Maximum log file size (in Bytes)
  "maxFiles" : 2 // Maximum number of files archived
}
```