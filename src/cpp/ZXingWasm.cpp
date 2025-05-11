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

thread_local const val Uint8Array = val::global("Uint8Array");
thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");

struct Symbol {
  val data;
  int width;
  int height;
};

// Helper function to create a Symbol object
Symbol createSymbolFromBarcodeSymbol(const ZXing::ImageView &barcodeSymbol) {
  return Symbol{
    .data = std::move(Uint8ClampedArray.new_(
      val(typed_memory_view(static_cast<std::size_t>(barcodeSymbol.rowStride()) * barcodeSymbol.height(), barcodeSymbol.data()))
    )),
    .width = barcodeSymbol.width(),
    .height = barcodeSymbol.height()
  };
}

#if defined(READER)

struct JsReaderOptions {
  int formats;
  bool tryHarder;
  bool tryRotate;
  bool tryInvert;
  bool tryDownscale;
  bool tryDenoise;
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

struct JsReadResult {
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
  bool readerInit;
  int lineCount;
  std::string version;
  Symbol symbol;
};

using JsReadResults = std::vector<JsReadResult>;

JsReadResults readBarcodes(ZXing::ImageView imageView, const JsReaderOptions &jsReaderOptions) {
  try {
    auto barcodes = ZXing::ReadBarcodes(
      imageView,
      ZXing::ReaderOptions()
        .setFormats(static_cast<ZXing::BarcodeFormat>(jsReaderOptions.formats))
        .setTryHarder(jsReaderOptions.tryHarder)
        .setTryRotate(jsReaderOptions.tryRotate)
        .setTryInvert(jsReaderOptions.tryInvert)
        .setTryDownscale(jsReaderOptions.tryDownscale)
        .setTryDenoise(jsReaderOptions.tryDenoise)
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

    JsReadResults jsReadResults;
    jsReadResults.reserve(barcodes.size());

    for (auto &barcode : barcodes) {

      auto barcodeSymbol = barcode.symbol();

      jsReadResults.push_back(
        {.isValid = barcode.isValid(),
         .error = ZXing::ToString(barcode.error()),
         .format = static_cast<int>(barcode.format()),
         .bytes = std::move(Uint8Array.new_(val(typed_memory_view(barcode.bytes().size(), barcode.bytes().data())))),
         .bytesECI = std::move(Uint8Array.new_(val(typed_memory_view(barcode.bytesECI().size(), barcode.bytesECI().data())))),
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
         .readerInit = barcode.readerInit(),
         .lineCount = barcode.lineCount(),
         .version = barcode.version(),
         .symbol = createSymbolFromBarcodeSymbol(barcodeSymbol)}
      );
    }
    return jsReadResults;
  } catch (const std::exception &e) {
    return {{.error = e.what()}};
  } catch (...) {
    return {{.error = "Unknown error"}};
  }
}

JsReadResults readBarcodesFromImage(int bufferPtr, int bufferLength, const JsReaderOptions &jsReaderOptions) {
  int width, height, channels;
  std::unique_ptr<stbi_uc, void (*)(void *)> buffer(
    stbi_load_from_memory(reinterpret_cast<const stbi_uc *>(bufferPtr), bufferLength, &width, &height, &channels, 1), stbi_image_free
  );
  if (!buffer) {
    return {{.error = "Failed to load image from memory"}};
  }
  return readBarcodes({buffer.get(), width, height, ZXing::ImageFormat::Lum}, jsReaderOptions);
}

JsReadResults readBarcodesFromPixmap(int bufferPtr, int width, int height, const JsReaderOptions &jsReaderOptions) {
  return readBarcodes({reinterpret_cast<const uint8_t *>(bufferPtr), width, height, ZXing::ImageFormat::RGBA}, jsReaderOptions);
}

#endif

#if defined(WRITER)

struct JsWriterOptions {
  // ZXing::CreatorOptions
  int format;
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
    return ZXing::CreatorOptions(static_cast<ZXing::BarcodeFormat>(jsWriterOptions.format))
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

struct JsWriteResult {
  std::string error;
  std::string svg;
  std::string utf8;
  val image;
  Symbol symbol;
};

JsWriteResult writeBarcodeFromText(std::string text, const JsWriterOptions &jsWriterOptions) {
  try {
    auto barcode = ZXing::CreateBarcodeFromText(text, createCreatorOptions(jsWriterOptions));
    auto writerOptions = createWriterOptions(jsWriterOptions);

    auto image = ZXing::WriteBarcodeToImage(barcode, writerOptions);

    int len;
    uint8_t *bytes = stbi_write_png_to_mem(image.data(), image.rowStride(), image.width(), image.height(), ZXing::PixStride(image.format()), &len);

    // Wrap into JS typed array *before* freeing.
    val jsImage = Uint8Array.new_(val(typed_memory_view(len, bytes)));

    free(bytes); // Prevent leak – STBI allocates with malloc

    auto barcodeSymbol = barcode.symbol();

    return {
      .svg = ZXing::WriteBarcodeToSVG(barcode, writerOptions),
      .utf8 = ZXing::WriteBarcodeToUtf8(barcode, writerOptions),
      .image = std::move(jsImage),
      .symbol = createSymbolFromBarcodeSymbol(barcodeSymbol)
    };
  } catch (const std::exception &e) {
    return {.error = e.what()};
  } catch (...) {
    return {.error = "Unknown error"};
  }
}

JsWriteResult writeBarcodeFromBytes(int bufferPtr, int bufferLength, const JsWriterOptions &jsWriterOptions) {
  try {
    auto barcode = ZXing::CreateBarcodeFromBytes(reinterpret_cast<const void *>(bufferPtr), bufferLength, createCreatorOptions(jsWriterOptions));
    auto writerOptions = createWriterOptions(jsWriterOptions);

    auto image = ZXing::WriteBarcodeToImage(barcode, writerOptions);

    int len;
    uint8_t *bytes = stbi_write_png_to_mem(image.data(), image.rowStride(), image.width(), image.height(), ZXing::PixStride(image.format()), &len);

    // Wrap into JS typed array *before* freeing.
    val jsImage = Uint8Array.new_(val(typed_memory_view(len, bytes)));

    free(bytes); // Prevent leak – STBI allocates with malloc

    auto barcodeSymbol = barcode.symbol();

    return {
      .svg = ZXing::WriteBarcodeToSVG(barcode, writerOptions),
      .utf8 = ZXing::WriteBarcodeToUtf8(barcode, writerOptions),
      .image = std::move(jsImage),
      .symbol = createSymbolFromBarcodeSymbol(barcodeSymbol)
    };
  } catch (const std::exception &e) {
    return {.error = e.what()};
  } catch (...) {
    return {.error = "Unknown error"};
  }
}

#endif

EMSCRIPTEN_BINDINGS(ZXingWasm) {

  value_object<Symbol>("Symbol").field("data", &Symbol::data).field("width", &Symbol::width).field("height", &Symbol::height);

#if defined(READER)

  value_object<JsReaderOptions>("ReaderOptions")
    .field("formats", &JsReaderOptions::formats)
    .field("tryHarder", &JsReaderOptions::tryHarder)
    .field("tryRotate", &JsReaderOptions::tryRotate)
    .field("tryInvert", &JsReaderOptions::tryInvert)
    .field("tryDownscale", &JsReaderOptions::tryDownscale)
    .field("tryDenoise", &JsReaderOptions::tryDenoise)
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

  value_object<ZXing::PointI>("Point").field("x", &ZXing::PointI::x).field("y", &ZXing::PointI::y);

  value_object<ZXing::Position>("Position")
    .field("topLeft", emscripten::index<0>())
    .field("topRight", emscripten::index<1>())
    .field("bottomRight", emscripten::index<2>())
    .field("bottomLeft", emscripten::index<3>());

  value_object<JsReadResult>("ReadResult")
    .field("isValid", &JsReadResult::isValid)
    .field("error", &JsReadResult::error)
    .field("format", &JsReadResult::format)
    .field("bytes", &JsReadResult::bytes)
    .field("bytesECI", &JsReadResult::bytesECI)
    .field("text", &JsReadResult::text)
    .field("ecLevel", &JsReadResult::ecLevel)
    .field("contentType", &JsReadResult::contentType)
    .field("hasECI", &JsReadResult::hasECI)
    .field("position", &JsReadResult::position)
    .field("orientation", &JsReadResult::orientation)
    .field("isMirrored", &JsReadResult::isMirrored)
    .field("isInverted", &JsReadResult::isInverted)
    .field("symbologyIdentifier", &JsReadResult::symbologyIdentifier)
    .field("sequenceSize", &JsReadResult::sequenceSize)
    .field("sequenceIndex", &JsReadResult::sequenceIndex)
    .field("sequenceId", &JsReadResult::sequenceId)
    .field("readerInit", &JsReadResult::readerInit)
    .field("lineCount", &JsReadResult::lineCount)
    .field("version", &JsReadResult::version)
    .field("symbol", &JsReadResult::symbol);

  register_vector<JsReadResult>("ReadResults");

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

  value_object<JsWriteResult>("WriteResult")
    .field("error", &JsWriteResult::error)
    .field("svg", &JsWriteResult::svg)
    .field("utf8", &JsWriteResult::utf8)
    .field("image", &JsWriteResult::image)
    .field("symbol", &JsWriteResult::symbol);

  function("writeBarcodeFromText", &writeBarcodeFromText);
  function("writeBarcodeFromBytes", &writeBarcodeFromBytes);

#endif
};
