const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

function resolvePromise(promise, target, resolve, reject) {
  if (promise === target) {
    reject(new TypeError(`Chaining cycle detected for promise #<Promise>!`));
    return;
  }

  let called = false;

  if (
    (typeof target === "object" && target !== null) ||
    typeof target === "function"
  ) {
    try {
      // see: https://promisesaplus.com/#point-75
      let then = target.then;
      if (typeof then === "function") {
        then.call(
          target,
          (x) => {
            if (called) return;
            called = true;
            resolvePromise(promise, x, resolve, reject);
          },
          (reason) => {
            if (called) return;
            called = true;
            reject(reason);
          }
        );
      } else {
        resolve(target);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    resolve(target);
  }
}

class Promise {
  value = undefined;
  reason = undefined;
  status = PENDING;

  onFulfilledCallbacks = [];
  onRejectedCallbacks = [];

  constructor(executor) {
    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  resolve(value) {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.onFulfilledCallbacks.forEach((fn) => fn());
    }
  }

  reject(reason) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach((fn) => fn());
    }
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== "function") onFulfilled = (value) => value;
    if (typeof onRejected !== "function")
      onRejected = (error) => {
        throw error;
      };

    const promise = new Promise((resolve, reject) => {
      if (this.status === PENDING) {
        [
          [this.onFulfilledCallbacks, onFulfilled, "value"],
          [this.onRejectedCallbacks, onRejected, "reason"],
        ].forEach(([callbacksArr, handler, key]) => {
          callbacksArr.push(() => {
            queueMicrotask(() => {
              try {
                const x = handler(this[key]);
                resolvePromise(promise, x, resolve, reject);
              } catch (error) {
                reject(error);
              }
            });
          });
        });
      } else {
        queueMicrotask(() => {
          try {
            const value =
              this.status === FULFILLED
                ? onFulfilled(this.value)
                : onRejected(this.reason);

            resolvePromise(promise, value, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      }
    });

    return promise;
  }
}

module.exports.Promise = Promise;
