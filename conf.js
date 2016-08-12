'use strict';

module.exports = {
  routes: {
    public: {},
    private: {
      'post /addScheduledJob': 'app/server/controllers/ScheduleController.addScheduledJobAction',
      'post /toggleScheduledJobs': 'app/server/controllers/ScheduleController.toggleScheduledJobsAction'
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
      name: 'MANAGE.PERMISSIONS.GROUP_DETAIL.ACCESS_PAGE_NAME'
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
        '/manage/lib/socket.io-client/socket.io.js'
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
        '/manage/ovManage/ManageService.js',
        '/manage/ovManage/DeviceController.js',
        '/manage/ovManage/DeviceService.js',
        '/manage/ovManage/DeviceDetailController.js',
        '/manage/ovManage/SortTableDirective.js',
        '/manage/socket.io/SocketApp.js'
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
