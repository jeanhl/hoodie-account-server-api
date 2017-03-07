var simple = require('simple-mock')
var test = require('tap').test

var findSession = require('../../../lib/sessions/find')

test('findSession', function (group) {
  group.test('user not found', function (t) {
    findSession({
      db: {
        get: simple.stub().rejectWith(new Error('oops'))
      }
    }, 'sessionid')

    .then(function () {
      t.fail('should not resolve')
    })

    .catch(function (error) {
      t.is(error.message, 'oops')
      t.end()
    })
  })

  group.test('user found but session invalid', function (t) {
    findSession({
      secret: 'secret',
      db: {
        get: simple.stub().resolveWith({
          salt: 'salt123'
        })
      }
    }, 'sessionid')

    .then(function () {
      t.fail('should not resolve')
    })

    .catch(function (error) {
      t.is(error.message, 'Session invalid')
      t.end()
    })
  })

  group.test('user found and session valid', function (t) {
    simple.mock(findSession.internals, 'isValidSessionId').returnWith(true)
    findSession({
      secret: 'secret',
      db: {
        get: simple.stub().resolveWith({
          roles: ['id:user123'],
          salt: 'salt123'
        })
      }
    }, 'sessionid')

    .then(function (session) {
      t.is(session.id, 'sessionid')
      t.end()
    })

    .catch(t.error)
  })

  group.test('user document cached after first request', function (t) {
    var dbGetStub = simple.stub().resolveWith({
      salt: 'salt123'
    })
    var state = {
      secret: 'secret',
      db: {
        get: dbGetStub
      }
    }

    findSession(state, 'sessionid')

    .catch(function () {
      return findSession(state, 'sessionid')
    })

    .catch(function () {
      t.is(dbGetStub.callCount, 1)
      t.end()
    })
  })

  group.end()
})
