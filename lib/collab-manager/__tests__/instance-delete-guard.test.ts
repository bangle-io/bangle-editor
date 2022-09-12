import { InstanceDeleteGuard } from '../src/instance-delete-guard';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('multiple items', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 1000,
    maxDurationToKeepRecord: 2000,
  });

  let deleteCallback = jest.fn();

  jest.advanceTimersByTime(10);
  guard.addPendingDelete('doc1', deleteCallback);

  jest.advanceTimersByTime(10);
  guard.addPendingDelete('doc2', deleteCallback);

  jest.advanceTimersByTime(10);
  guard.addPendingDelete('doc3', deleteCallback);

  jest.advanceTimersByTime(10);
  guard.addPendingDelete('doc4', deleteCallback);

  expect(guard.pendingDeleteRecord.size).toBe(4);

  // keeps the most recent 2 records
  expect([...guard.pendingDeleteRecord.entries()].map((r) => r[0])).toEqual([
    'doc1',
    'doc2',
    'doc3',
    'doc4',
  ]);
});

test('removes items if they hit max number of records to be stored', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 1000,
    maxDurationToKeepRecord: 2000,
  });

  let deleteCallback = jest.fn();

  // limit is hardcoded in maxNoOfPendingRecords
  Array.from({ length: 1500 }).forEach((_, i) => {
    jest.advanceTimersByTime(1);
    guard.addPendingDelete('doc' + i, deleteCallback);
  });

  expect(guard.pendingDeleteRecord.size).toBe(100);

  // keeps the most recent 1000 records
  expect(
    [...guard.pendingDeleteRecord.entries()].map((r) => r[0]).slice(0, 3),
  ).toEqual(['doc1499', 'doc1498', 'doc1497']);
});

test('calls delete callback after timeout', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 1000,
    maxDurationToKeepRecord: 2000,
  });

  let deleteCallback = jest.fn();

  jest.advanceTimersByTime(10);
  guard.addPendingDelete('doc1', deleteCallback);

  expect(deleteCallback).toBeCalledTimes(0);
  jest.advanceTimersByTime(1001);
  expect(deleteCallback).toBeCalledTimes(1);
});

test('removes records that are too old', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 1000,
    maxDurationToKeepRecord: 2000,
  });

  let deleteCallback1 = jest.fn();
  let deleteCallback2 = jest.fn();
  let deleteCallback3 = jest.fn();

  jest.advanceTimersByTime(10);
  guard.addPendingDelete('doc1', deleteCallback1);

  jest.advanceTimersByTime(10);
  guard.addPendingDelete('doc2', deleteCallback2);

  // advance timer so that previous items become old
  jest.advanceTimersByTime(2000 + 100);
  guard.addPendingDelete('doc3', deleteCallback3);

  // will keep on doc3 around as doc2 is too old
  expect([...guard.pendingDeleteRecord.entries()].map((r) => r[0])).toEqual([
    'doc3',
  ]);

  expect(deleteCallback1).toHaveBeenCalled();
  expect(deleteCallback2).toHaveBeenCalled();

  expect(deleteCallback3).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1000 + 100);
  expect(deleteCallback3).toHaveBeenCalledTimes(1);
});

test('adding the same docName again cancels the previous pending delete', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 5000,
    maxDurationToKeepRecord: 20000,
  });

  let deleteCallback = jest.fn();
  let deleteCallback2 = jest.fn();

  guard.addPendingDelete('doc1', deleteCallback);

  jest.advanceTimersByTime(1000);
  guard.addPendingDelete('doc1', deleteCallback2);

  jest.advanceTimersByTime(8000);

  expect(deleteCallback).toBeCalledTimes(0);

  expect(deleteCallback2).toBeCalledTimes(1);
});

test('check returns true for docName that does not exist', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 5000,
    maxDurationToKeepRecord: 20000,
  });

  expect(guard.checkAccess('doc1', 1)).toBe(true);
});

test('check returns false for docName that is old', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 5000,
    maxDurationToKeepRecord: 20000,
  });

  let deleteCallback = jest.fn();

  const now = Date.now();

  guard.addPendingDelete('doc1', deleteCallback);

  expect(guard.checkAccess('doc1', now)).toBe(false);

  jest.advanceTimersByTime(6000);

  // delete callback should be called
  expect(deleteCallback).toBeCalledTimes(1);
});

test('cancels pending delete callback if doc is new', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 5000,
    maxDurationToKeepRecord: 20000,
  });

  let deleteCallback = jest.fn();

  const time0 = Date.now();

  guard.addPendingDelete('doc1', deleteCallback);

  // an item created after addPendingDelete
  expect(guard.checkAccess('doc1', time0 + 6000)).toBe(true);

  // let plenty of time pass
  jest.advanceTimersByTime(8000);

  // delete callback should be cancelled, since a new docName accessed the instance
  expect(deleteCallback).toBeCalledTimes(0);

  // should continue to return false for old clients
  expect(guard.checkAccess('doc1', time0)).toBe(false);
});

test('throws error if deleteWaitTime is greater than maxDurationToKeepRecord', () => {
  expect(() => {
    new InstanceDeleteGuard({
      deleteWaitTime: 5000,
      maxDurationToKeepRecord: 2000,
    });
  }).toThrowError('deleteWaitTime must be less than maxDurationToKeepRecord');
});

test('destroy works', () => {
  const guard = new InstanceDeleteGuard({
    deleteWaitTime: 5000,
    maxDurationToKeepRecord: 20000,
  });

  let deleteCallback = jest.fn();

  guard.addPendingDelete('doc1', deleteCallback);

  guard.destroy();

  jest.advanceTimersByTime(6000);

  expect(deleteCallback).toBeCalledTimes(0);
  expect(guard.pendingDeleteRecord.size).toBe(0);
});
