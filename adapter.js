const { Promise } = require("./promise");

module.exports.deferred = () => {
  const ret = {};

  ret.promise = new Promise((resolve, reject) => {
    ret.resolve = resolve;
    ret.reject = reject;
  });

  return ret;
};
