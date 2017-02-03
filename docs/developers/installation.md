# Clone project from git

From OpenVeo parent directory :

    git clone git@github.com:veo-labs/openveo-manage.git

You should have someting like this :

```
.
├── openveo-core
├── openveo-manage
```

# Install project's dependencies

    cd openveo-manage
    npm install

# Link plugin to the core

    cd openveo-manage
    npm link

    cd openveo-core
    npm link @openveo/manage

