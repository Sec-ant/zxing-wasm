import zxingModuleFactory from "../wasm/zxing_writer.js";
import {
  ZXingModuleFactoryTypeExtractor,
  ZXingModuleOverrides,
  writeBarcodeToImageFile as _writeBarcodeToImageFile,
  getZXingModule as _getZXingModule,
  defaultZXingWriteOptions,
  ZXingWriteOptions,
  ZXingWriteOutput,
} from "../core.js";

export function getZXingModule(
  zxingModuleOverrides?: ZXingModuleOverrides<
    ZXingModuleFactoryTypeExtractor<typeof zxingModuleFactory>
  >,
): ReturnType<typeof _getZXingModule> {
  return _getZXingModule(zxingModuleFactory, zxingModuleOverrides);
}

export async function writeBarcodeToImageFile(
  text: string,
  {
    format = defaultZXingWriteOptions.format,
    charset = defaultZXingWriteOptions.charset,
    quietZone = defaultZXingWriteOptions.quietZone,
    width = defaultZXingWriteOptions.width,
    height = defaultZXingWriteOptions.height,
    eccLevel = defaultZXingWriteOptions.eccLevel,
  }: ZXingWriteOptions = defaultZXingWriteOptions,
): Promise<ZXingWriteOutput> {
  return _writeBarcodeToImageFile(
    text,
    {
      format,
      charset,
      quietZone,
      width,
      height,
      eccLevel,
    },
    zxingModuleFactory,
  );
}

export * from "../exposed.js";
