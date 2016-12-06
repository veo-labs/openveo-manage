# Socket Server

Manage uses [Socket.io](http://socket.io) to interact with encoders and its back end interface. As Manage plugin is loaded, it instantiates a socket.io server with 2 namespaces. The first one to interact with encoders. The second one to control the back end interface and thus communicate with browsers.

# Entities

Manage defines new entities :

- **devices** - Devices like encoders
- **groups** - Groups of devices