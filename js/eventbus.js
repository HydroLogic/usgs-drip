(function ($, App) {

  'use strict';

  function EventBus() { }

  EventBus.prototype.subscribe = function (event, fn) {
    console.log('EventBus.subscribe(%s)', event);
    $(this).bind(event, fn);
  };

  EventBus.prototype.unsubscribe = function (event, fn) {
    console.log('EventBus.unsubscribe(%s)', event);
    $(this).unbind(event, fn);
  };

  EventBus.prototype.publish = function (event, data) {
    console.log('EventBus.publish(%s, %s)', event, data);
    $(this).trigger(event, data);
  };

  App.EventBus = new EventBus();

})(jQuery, window.App || {});
