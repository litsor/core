'use strict';

module.exports = {
  tests: [{
    title: 'Will validate correct hash',
    left: 'Aalu9aa94uFSOaGm9hCBOTkTwBXOIFcNeLGM43ZCg4pplMlFdzbzoQN2TJI9s/8debmYw/TzrPDvYL1yA/NqBHvhZ1T/l7Y6jvql5NjOvIkC',
    right: 'Welcome',
    output: true
  }, {
    title: 'Will reject incorrect hash',
    left: 'Aalu9aa94uFSOaGm9hCBOTkTwBXOIFcNeLGM43ZCg4pplMlFdzbzoQN2TJI9s/8debmYw/TzrPDvYL1yA/NqBHvhZ1T/l7Y6jvql5NjOvIkC',
    right: 'Welcome!',
    output: false
  }, {
    title: 'Will throw an error when with incorrect version',
    left: 'Bblu9aa94uFSOaGm9hCBOTkTwBXOIFcNeLGM43ZCg4pplMlFdzbzoQN2TJI9s/8debmYw/TzrPDvYL1yA/NqBHvhZ1T/l7Y6jvql5NjOvIkC',
    right: 'Welcome!',
    error: err => {
      return err.message === 'Unsupported hash';
    }
  }]
};
