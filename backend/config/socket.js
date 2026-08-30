let ioInstance = null;

function setIO(io) {
  ioInstance = io;
  if (typeof global !== 'undefined') {
    global.io = io;
  }
}

function getIO() {
  if (ioInstance) return ioInstance;
  if (typeof global !== 'undefined' && global.io) return global.io;
  return null;
}

const socketProxy = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === 'setIO') return setIO;
      if (prop === 'getIO') return getIO;

      const instance = getIO();
      if (instance && typeof instance[prop] === 'function') {
        return instance[prop].bind(instance);
      }
      if (instance && prop in instance) {
        return instance[prop];
      }

      if (prop === 'to' || prop === 'in') {
        return (room) => ({
          emit: (event, data) => {
            const inst = getIO();
            if (inst && typeof inst.to === 'function') {
              return inst.to(room).emit(event, data);
            }
          },
        });
      }

      if (prop === 'emit') {
        return (event, data) => {
          const inst = getIO();
          if (inst && typeof inst.emit === 'function') {
            return inst.emit(event, data);
          }
        };
      }

      return undefined;
    },
  }
);

module.exports = socketProxy;
