'use strict';

module.exports = {
  routes: {
    public: {},
    private: {
      'get /configuration': 'app/server/controllers/ManageController.getConfigurationAction'
    },
    ws: {}
  },
  entities: {
    devices: 'app/server/controllers/DeviceController',
    groups: 'app/server/controllers/GroupController'
  },
  permissions: [
    {
      id: 'manage-access-page',
      name: 'MANAGE.PERMISSIONS.ACCESS_PAGE_NAME'
    },
    {
      id: 'manage-group-detail-access-page',
      name: 'MANAGE.PERMISSIONS.ACCESS_GROUP_DETAIL_PAGE_NAME',
      paths: [
        'get /manage/group-detail*'
      ]
    }
  ],
  backOffice: {
    menu: [
      {
        weight: -50,
        label: 'MANAGE.MENU.MANAGE',
        subMenu: [
          {
            label: 'MANAGE.MENU.MANAGE',
            path: 'manage',
            permission: 'manage-access-page'
          }
        ]
      }
    ],
    scriptLibFiles: {
      base: [
        '/manage/lib/interact.js/dist/interact.min.js',
        '/manage/lib/socket.io-client/socket.io.js',
        '/manage/lib/perfect-scrollbar/js/perfect-scrollbar.min.js'
      ],
      dev: [],
      prod: [
        '/manage/be/js/libOpenveoManage.js'
      ]
    },
    scriptFiles: {
      base: [],
      dev: [
        '/manage/ovManage/App.js',
        '/manage/ovManage/MainController.js',
        '/manage/ovManage/ManageFactory.js',
        '/manage/ovManage/ManageableFactory.js',
        '/manage/ovManage/DeviceFactory.js',
        '/manage/ovManage/GroupFactory.js',
        '/manage/ovManage/ManageableController.js',
        '/manage/ovManage/ManageableDetailController.js',
        '/manage/ovManage/SortTableDirective.js',
        '/manage/socket.io/SocketApp.js'
      ],
      prod: [
        '/manage/be/js/openveoManage.js'
      ]
    },
    cssFiles: [
      '/manage/be/css/manage.css',
      '/manage/lib/perfect-scrollbar/css/perfect-scrollbar.min.css'
    ]
  }
};
