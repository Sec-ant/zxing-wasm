/*
 * Copyright 2016 Nu-book Inc.
 * Copyright 2023 Axel Waggershauser
 * Copyright 2023 Ze-Zheng Wu
 */
// SPDX-License-Identifier: Apache-2.0
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <memory>
#include <stdexcept>
#include <string>

#if defined(READER)
  #include "ReadBarcode.h"
  #define STB_IMAGE_IMPLEMENTATION
  #include <stb_image.h>
#endif

#if defined(WRITER)
  #include "WriteBarcode.h"
  #define STB_IMAGE_WRITE_IMPLEMENTATION
  #include <stb_image_write.h>
#endif

using namespace emscripten;

#if defined(READER)

struct JsBarcode {
  bool isValid;
  std::string error;
  int format;
  val bytes;
  val bytesECI;
  std::string text;
  std::string ecLevel;
  int contentType;
  bool hasECI;
  ZXing::Position position;
  int orientation;
  bool isMirrored;
  bool isInverted;
  std::string symbologyIdentifier;
  int sequenceSize;
  int sequenceIndex;
  std::string sequenceId;
  bool isLastInSequence;
  bool isPartOfSequence;
  bool readerInit;
  int lineCount;
  std::string version;
};

using JsBarcodes = std::vector<JsBarcode>;

struct JsReaderOptions {
  std::string formats;
  bool tryHarder;
  bool tryRotate;
  bool tryInvert;
  bool tryDownscale;
  #ifdef ZXING_EXPERIMENTAL_API
  bool tryDenoise;
  #endif
  uint8_t binarizer;
  bool isPure;
  uint16_t downscaleThreshold;
  uint8_t downscaleFactor;
  uint8_t minLineCount;
  uint8_t maxNumberOfSymbols;
  bool tryCode39ExtendedMode;
  bool returnErrors;
  uint8_t eanAddOnSymbol;
  uint8_t textMode;
  uint8_t characterSet;
};

JsBarcodes readBarcodes(ZXing::ImageView imageView, const JsReaderOptions &jsReaderOptions) {
  try {
    auto barcodes = ZXing::ReadBarcodes(
      imageView,
      ZXing::ReaderOptions()
        .setFormats(ZXing::BarcodeFormatsFromString(jsReaderOptions.formats))
        .setTryHarder(jsReaderOptions.tryHarder)
        .setTryRotate(jsReaderOptions.tryRotate)
        .setTryInvert(jsReaderOptions.tryInvert)
        .setTryDownscale(jsReaderOptions.tryDownscale)
  #ifdef ZXING_EXPERIMENTAL_API
        .setTryDenoise(jsReaderOptions.tryDenoise)
  #endif
        .setBinarizer(static_cast<ZXing::Binarizer>(jsReaderOptions.binarizer))
        .setIsPure(jsReaderOptions.isPure)
        .setDownscaleThreshold(jsReaderOptions.downscaleThreshold)
        .setDownscaleFactor(jsReaderOptions.downscaleFactor)
        .setMinLineCount(jsReaderOptions.minLineCount)
        .setMaxNumberOfSymbols(jsReaderOptions.maxNumberOfSymbols)
        .setTryCode39ExtendedMode(jsReaderOptions.tryCode39ExtendedMode)
        .setReturnErrors(jsReaderOptions.returnErrors)
        .setEanAddOnSymbol(static_cast<ZXing::EanAddOnSymbol>(jsReaderOptions.eanAddOnSymbol))
        .setTextMode(static_cast<ZXing::TextMode>(jsReaderOptions.textMode))
        .setCharacterSet(static_cast<ZXing::CharacterSet>(jsReaderOptions.characterSet))
    );

    JsBarcodes jsBarcodes;
    jsBarcodes.reserve(barcodes.size());

    for (auto &barcode : barcodes) {
      jsBarcodes.push_back(
        {.isValid = barcode.isValid(),
         .error = ZXing::ToString(barcode.error()),
         .format = static_cast<int>(barcode.format()),
         .bytes = std::move(val(typed_memory_view(barcode.bytes().size(), barcode.bytes().data()))),
         .bytesECI = std::move(val(typed_memory_view(barcode.bytesECI().size(), barcode.bytesECI().data()))),
         .text = barcode.text(),
         .ecLevel = barcode.ecLevel(),
         .contentType = static_cast<int>(barcode.contentType()),
         .hasECI = barcode.hasECI(),
         .position = barcode.position(),
         .orientation = barcode.orientation(),
         .isMirrored = barcode.isMirrored(),
         .isInverted = barcode.isInverted(),
         .symbologyIdentifier = barcode.symbologyIdentifier(),
         .sequenceSize = barcode.sequenceSize(),
         .sequenceIndex = barcode.sequenceIndex(),
         .sequenceId = barcode.sequenceId(),
         .isLastInSequence = barcode.isLastInSequence(),
         .isPartOfSequence = barcode.isPartOfSequence(),
         .readerInit = barcode.readerInit(),
         .lineCount = barcode.lineCount(),
         .version = barcode.version()}
      );
    }
    return jsBarcodes;
  } catch (const std::exception &e) {
    return {{.error = e.what()}};
  } catch (...) {
    return {{.error = "Unknown error"}};
  }
}

JsBarcodes readBarcodesFromImage(int bufferPtr, int bufferLength, const JsReaderOptions &jsReaderOptions) {
  int width, height, channels;
  std::unique_ptr<stbi_uc, void (*)(void *)> buffer(
    stbi_load_from_memory(reinterpret_cast<const stbi_uc *>(bufferPtr), bufferLength, &width, &height, &channels, 1), stbi_image_free
  );
  if (!buffer) {
    return {{.error = "Failed to load image from memory"}};
  }
  return readBarcodes({buffer.get(), width, height, ZXing::ImageFormat::Lum}, jsReaderOptions);
}

JsBarcodes readBarcodesFromPixmap(int bufferPtr, int width, int height, const JsReaderOptions &jsReaderOptions) {
  return readBarcodes({reinterpret_cast<const uint8_t *>(bufferPtr), width, height, ZXing::ImageFormat::RGBA}, jsReaderOptions);
}

#endif

#if defined(WRITER)

struct JsWriterOptions {
  // ZXing::CreatorOptions
  std::string format;
  bool readerInit;
  bool forceSquareDataMatrix;
  std::string ecLevel;
  // ZXing::WriterOptions
  int scale;
  int sizeHint;
  int rotate;
  bool withHRT;
  bool withQuietZones;
};

namespace {

  ZXing::CreatorOptions createCreatorOptions(const JsWriterOptions &jsWriterOptions) {
    return ZXing::CreatorOptions(ZXing::BarcodeFormatFromString(jsWriterOptions.format))
      .readerInit(jsWriterOptions.readerInit)
      .forceSquareDataMatrix(jsWriterOptions.forceSquareDataMatrix)
      .ecLevel(jsWriterOptions.ecLevel);
  }

  ZXing::WriterOptions createWriterOptions(const JsWriterOptions &jsWriterOptions) {
    return ZXing::WriterOptions()
      .scale(jsWriterOptions.scale)
      .sizeHint(jsWriterOptions.sizeHint)
      .rotate(jsWriterOptions.rotate)
      .withHRT(jsWriterOptions.withHRT)
      .withQuietZones(jsWriterOptions.withQuietZones);
  }

} // anonymous namespace

std::string writeBarcodeFromTextToSVG(std::string text, const JsWriterOptions &jsWriterOptions) {
  return ZXing::WriteBarcodeToSVG(ZXing::CreateBarcodeFromText(text, createCreatorOptions(jsWriterOptions)), createWriterOptions(jsWriterOptions));
}

std::string writeBarcodeFromBytesToSVG(int bufferPtr, int bufferLength, const JsWriterOptions &jsWriterOptions) {
  return ZXing::WriteBarcodeToSVG(
    ZXing::CreateBarcodeFromBytes(reinterpret_cast<const void *>(bufferPtr), bufferLength, createCreatorOptions(jsWriterOptions)),
    createWriterOptions(jsWriterOptions)
  );
}

std::string writeBarcodesFromTextToUtf8(std::string text, const JsWriterOptions &jsWriterOptions) {
  return ZXing::WriteBarcodeToUtf8(ZXing::CreateBarcodeFromText(text, createCreatorOptions(jsWriterOptions)), createWriterOptions(jsWriterOptions));
}

std::string writeBarcodesFromBytesToUtf8(int bufferPtr, int bufferLength, const JsWriterOptions &jsWriterOptions) {
  return ZXing::WriteBarcodeToUtf8(
    ZXing::CreateBarcodeFromBytes(reinterpret_cast<const void *>(bufferPtr), bufferLength, createCreatorOptions(jsWriterOptions)),
    createWriterOptions(jsWriterOptions)
  );
}

val writeBarcodeFromTextToImage(std::string text, const JsWriterOptions &jsWriterOptions) {
  auto image =
    ZXing::WriteBarcodeToImage(ZXing::CreateBarcodeFromText(text, createCreatorOptions(jsWriterOptions)), createWriterOptions(jsWriterOptions));

  int len;
  uint8_t *bytes = stbi_write_png_to_mem(image.data(), image.rowStride(), image.width(), image.height(), ZXing::PixStride(image.format()), &len);

  return val(typed_memory_view(len, bytes));
}

val writeBarcodeFromBytesToImage(int bufferPtr, int bufferLength, const JsWriterOptions &jsWriterOptions) {
  auto image = ZXing::WriteBarcodeToImage(
    ZXing::CreateBarcodeFromBytes(reinterpret_cast<const void *>(bufferPtr), bufferLength, createCreatorOptions(jsWriterOptions)),
    createWriterOptions(jsWriterOptions)
  );

  int len;
  uint8_t *bytes = stbi_write_png_to_mem(image.data(), image.rowStride(), image.width(), image.height(), ZXing::PixStride(image.format()), &len);

  return val(typed_memory_view(len, bytes));
}

#endif

EMSCRIPTEN_BINDINGS(ZXingWasm) {

#if defined(READER)

  value_object<ZXing::PointI>("Point").field("x", &ZXing::PointI::x).field("y", &ZXing::PointI::y);

  value_object<ZXing::Position>("Position")
    .field("topLeft", emscripten::index<0>())
    .field("topRight", emscripten::index<1>())
    .field("bottomRight", emscripten::index<2>())
    .field("bottomLeft", emscripten::index<3>());

  value_object<JsBarcode>("Barcode")
    .field("isValid", &JsBarcode::isValid)
    .field("error", &JsBarcode::error)
    .field("format", &JsBarcode::format)
    .field("bytes", &JsBarcode::bytes)
    .field("bytesECI", &JsBarcode::bytesECI)
    .field("text", &JsBarcode::text)
    .field("ecLevel", &JsBarcode::ecLevel)
    .field("contentType", &JsBarcode::contentType)
    .field("hasECI", &JsBarcode::hasECI)
    .field("position", &JsBarcode::position)
    .field("orientation", &JsBarcode::orientation)
    .field("isMirrored", &JsBarcode::isMirrored)
    .field("isInverted", &JsBarcode::isInverted)
    .field("symbologyIdentifier", &JsBarcode::symbologyIdentifier)
    .field("sequenceSize", &JsBarcode::sequenceSize)
    .field("sequenceIndex", &JsBarcode::sequenceIndex)
    .field("sequenceId", &JsBarcode::sequenceId)
    .field("isLastInSequence", &JsBarcode::isLastInSequence)
    .field("isPartOfSequence", &JsBarcode::isPartOfSequence)
    .field("readerInit", &JsBarcode::readerInit)
    .field("lineCount", &JsBarcode::lineCount)
    .field("version", &JsBarcode::version);

  register_vector<JsBarcode>("Barcodes");

  value_object<JsReaderOptions>("ReaderOptions")
    .field("formats", &JsReaderOptions::formats)
    .field("tryHarder", &JsReaderOptions::tryHarder)
    .field("tryRotate", &JsReaderOptions::tryRotate)
    .field("tryInvert", &JsReaderOptions::tryInvert)
    .field("tryDownscale", &JsReaderOptions::tryDownscale)
  #ifdef ZXING_EXPERIMENTAL_API
    .field("tryDenoise", &JsReaderOptions::tryDenoise)
  #endif
    .field("binarizer", &JsReaderOptions::binarizer)
    .field("isPure", &JsReaderOptions::isPure)
    .field("downscaleThreshold", &JsReaderOptions::downscaleThreshold)
    .field("downscaleFactor", &JsReaderOptions::downscaleFactor)
    .field("minLineCount", &JsReaderOptions::minLineCount)
    .field("maxNumberOfSymbols", &JsReaderOptions::maxNumberOfSymbols)
    .field("tryCode39ExtendedMode", &JsReaderOptions::tryCode39ExtendedMode)
    .field("returnErrors", &JsReaderOptions::returnErrors)
    .field("eanAddOnSymbol", &JsReaderOptions::eanAddOnSymbol)
    .field("textMode", &JsReaderOptions::textMode)
    .field("characterSet", &JsReaderOptions::characterSet);

  function("readBarcodesFromImage", &readBarcodesFromImage);
  function("readBarcodesFromPixmap", &readBarcodesFromPixmap);

#endif

#if defined(WRITER)

  value_object<JsWriterOptions>("WriterOptions")
    .field("format", &JsWriterOptions::format)
    .field("readerInit", &JsWriterOptions::readerInit)
    .field("forceSquareDataMatrix", &JsWriterOptions::forceSquareDataMatrix)
    .field("ecLevel", &JsWriterOptions::ecLevel)
    .field("scale", &JsWriterOptions::scale)
    .field("sizeHint", &JsWriterOptions::sizeHint)
    .field("rotate", &JsWriterOptions::rotate)
    .field("withHRT", &JsWriterOptions::withHRT)
    .field("withQuietZones", &JsWriterOptions::withQuietZones);

  function("writeBarcodeFromTextToSVG", &writeBarcodeFromTextToSVG);
  function("writeBarcodeFromBytesToSVG", &writeBarcodeFromBytesToSVG);
  function("writeBarcodesFromTextToUtf8", &writeBarcodesFromTextToUtf8);
  function("writeBarcodesFromBytesToUtf8", &writeBarcodesFromBytesToUtf8);
  function("writeBarcodeFromTextToImage", &writeBarcodeFromTextToImage);
  function("writeBarcodeFromBytesToImage", &writeBarcodeFromBytesToImage);

#endif
};
