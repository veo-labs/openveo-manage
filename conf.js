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
      id: 'manage-access-todo-page',
      name: 'MANAGE.PERMISSIONS.ACCESS_TODO_PAGE_NAME'
    }
  ],
  backOffice: {
    menu: [
      {
        weight: -50,
        label: 'MANAGE.MENU.MANAGE',
        subMenu: [
          {
            label: 'MANAGE.MENU.TODO',
            path: 'manage/todo',
            permission: 'manage-access-todo-page'
          }
        ]
      }
    ],
    scriptLibFiles: {
      base: [],
      dev: [],
      prod: []
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
