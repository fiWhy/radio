export const promiseTime = promise => {
  const timeStart = new Date();
  return promise.then(data => [
    data,
    new Date().getTime() - timeStart.getTime()
  ]);
};
