'use strict';

var BROWSERS_MESSAGES = process.requireManage('app/server/browsersMessages.js');
var BrowserSocketController = 'app/server/controllers/BrowserSocketController';

module.exports = {
  http: {
    routes: {
      public: {},
      private: {},
      ws: {}
    }
  },
  socket: {
    namespaces: {
      private: {
        browser: {
          [BROWSERS_MESSAGES.CONNECTED]: BrowserSocketController + '.connectAction',
          [BROWSERS_MESSAGES.UPDATE_NAME]: BrowserSocketController + '.updateNameAction',
          [BROWSERS_MESSAGES.REMOVE]: BrowserSocketController + '.removeAction',
          [BROWSERS_MESSAGES.REMOVE_HISTORIC]: BrowserSocketController + '.removeHistoricAction',
          [BROWSERS_MESSAGES.ADD_SCHEDULE]: BrowserSocketController + '.addScheduleAction',
          [BROWSERS_MESSAGES.REMOVE_SCHEDULE]: BrowserSocketController + '.removeScheduleAction',
          [BROWSERS_MESSAGES.REMOVE_HISTORY]: BrowserSocketController + '.removeHistoryAction',
          [BROWSERS_MESSAGES.GET_DEVICES]: BrowserSocketController + '.getDevicesAction',
          [BROWSERS_MESSAGES.GET_DEVICE_SETTINGS]: BrowserSocketController + '.getDeviceSettingsAction',
          [BROWSERS_MESSAGES.UPDATE_DEVICE_STATE]: BrowserSocketController + '.updateDeviceStateAction',
          [BROWSERS_MESSAGES.START_DEVICE_SESSION]: BrowserSocketController + '.startDeviceSessionAction',
          [BROWSERS_MESSAGES.STOP_DEVICE_SESSION]: BrowserSocketController + '.stopDeviceSessionAction',
          [BROWSERS_MESSAGES.INDEX_DEVICE_SESSION]: BrowserSocketController + '.indexDeviceSessionAction',
          [BROWSERS_MESSAGES.GET_GROUPS]: BrowserSocketController + '.getGroupsAction',
          [BROWSERS_MESSAGES.CREATE_GROUP]: BrowserSocketController + '.createGroupAction',
          [BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP]: BrowserSocketController + '.addDeviceToGroupAction',
          [BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP]: BrowserSocketController + '.removeDeviceFromGroupAction',
          [BROWSERS_MESSAGES.DISCONNECTED]: BrowserSocketController + '.disconnectAction',
          [BROWSERS_MESSAGES.ERROR]: BrowserSocketController + '.errorAction'
        }
      }
    }
  },
  permissions: [
    {
      label: 'MANAGE.PERMISSIONS.GROUP_MANAGE',
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
      ]
    }
  ],
  backOffice: {
    menu: [
      {
        weight: -101,
        label: 'MANAGE.MENU.MANAGE',
        path: 'manage',
        permission: 'manage-access-page'
      }
    ],
    scriptLibFiles: {
      dev: [],
      prod: []
    },
    scriptFiles: {
      dev: [
        'ovManage/App.js',
        'ovManage/MainController.js',
        'ovManage/ManageFactory.js',
        'ovManage/ManageableFactory.js',
        'ovManage/DeviceFactory.js',
        'ovManage/GroupFactory.js',
        'ovManage/ManageableController.js',
        'ovManage/ManageableDetailController.js',
        'ovManage/SortTableDirective.js'
      ],
      prod: [
        'be/js/openveoManage.js'
      ]
    },
    cssFiles: [
      'be/css/manage.css'
    ]
  },
  libraries: [
    {
      name: 'interactjs',
      mountPath: 'interactjs',
      files: ['dist/interact.min.js']
    },
    {
      name: 'perfect-scrollbar',
      mountPath: 'perfect-scrollbar',
      files: ['dist/js/perfect-scrollbar.min.js', 'dist/css/perfect-scrollbar.min.css']
    }
  ]
};
