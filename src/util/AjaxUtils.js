import jQuery from 'jquery';
import _ from 'lodash';

export default {
  send(options) {
    let defaultOptions = {};
    options = _.assign({}, defaultOptions, options);
    jQuery.ajax(options);
  }
};