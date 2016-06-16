'use strict';

module.exports = {
  routes: {
    public: {
    },
    private: {
    },
    ws: {
    }
  },
  entities: {
  },
  permissions: [
    {
      id: 'manage-access-page',
      name: 'MANAGE.PERMISSIONS.ACCESS_PAGE_NAME'
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
        '/manage/lib/interact.js/dist/interact.min.js'
      ],
      dev: [],
      prod: [
        '/manage/be/js/libOpenveoManage.js'
      ]
    },
    scriptFiles: {
      base: [],
      dev: [
        '/manage/ovManage/ManageApp.js',
        '/manage/ovManage/ManageController.js',
        '/manage/ovManage/ManageService.js'
      ],
      prod: [
        '/manage/be/js/openveoManage.js'
      ]
    },
    cssFiles: [
      '/manage/be/css/manage.css'
    ]
  }
};
