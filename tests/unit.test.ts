import { expect, test } from "vitest";
import {
  prepareZXingModule as prepareZXingFullModule,
  purgeZXingModule as purgeZXingFullModule,
} from "../src/full/index.js";
import { prepareZXingModule as prepareZXingReaderModule } from "../src/reader/index.js";

test("no module promise should be created without fireImmediately", () => {
  const modulePromise = prepareZXingFullModule();

  expect(modulePromise).toBe(undefined);
});

test("module promise should be created with fireImmediately", () => {
  const modulePromise = prepareZXingFullModule({
    fireImmediately: true,
  });

  modulePromise.catch(() => {});

  expect(modulePromise).toBeInstanceOf(Promise);
});

test("module promise should be reused with no overrides", () => {
  const modulePromise1 = prepareZXingFullModule({
    fireImmediately: true,
  });

  modulePromise1.catch(() => {});

  const modulePromise2 = prepareZXingFullModule({
    fireImmediately: true,
  });

  modulePromise2.catch(() => {});

  expect(modulePromise1).toBe(modulePromise2);
});

test("module promise should be reused with same overrides (Object.is)", () => {
  const overrides = {};

  const modulePromise1 = prepareZXingFullModule({
    overrides,
    fireImmediately: true,
  });

  modulePromise1.catch(() => {});

  const modulePromise2 = prepareZXingFullModule({
    overrides,
    fireImmediately: true,
  });

  modulePromise2.catch(() => {});

  expect(modulePromise1).toBe(modulePromise2);
});

test("module promise should be reused with same overrides (shallow)", () => {
  const modulePromise1 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise1.catch(() => {});

  const modulePromise2 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise2.catch(() => {});

  expect(modulePromise1).toBe(modulePromise2);
});

test("module promise shouldn't be reused with different overrides", () => {
  const modulePromise1 = prepareZXingFullModule({
    overrides: {
      locateFile: (url) => url,
    },
    fireImmediately: true,
  });

  modulePromise1.catch(() => {});

  const modulePromise2 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise2.catch(() => {});

  const modulePromise3 = prepareZXingFullModule({
    overrides: {
      locateFile: (url) => url,
    },
    fireImmediately: true,
  });

  modulePromise3.catch(() => {});

  expect(modulePromise1).not.toBe(modulePromise2);
  expect(modulePromise1).not.toBe(modulePromise3);
});

test("equalityFn should work", () => {
  const modulePromise1 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise1.catch(() => {});

  const modulePromise2 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
    equalityFn: Object.is,
  });

  modulePromise2.catch(() => {});

  expect(modulePromise1).not.toBe(modulePromise2);
});

test("purgeZXingModule should work", () => {
  const modulePromise1 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise1.catch(() => {});

  purgeZXingFullModule();

  const modulePromise2 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise2.catch(() => {});

  expect(modulePromise1).not.toBe(modulePromise2);
});

test("purgeZXingModule shouldn't affect each other", () => {
  const modulePromise1 = prepareZXingFullModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise1.catch(() => {});

  const modulePromise2 = prepareZXingReaderModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise2.catch(() => {});

  purgeZXingFullModule();

  const modulePromise3 = prepareZXingReaderModule({
    overrides: {},
    fireImmediately: true,
  });

  modulePromise3.catch(() => {});

  expect(modulePromise2).toBe(modulePromise3);
});
