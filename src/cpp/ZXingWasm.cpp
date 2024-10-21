/*
 * Copyright 2016 Nu-book Inc.
 * Copyright 2023 Axel Waggershauser
 * Copyright 2023 Ze-Zheng Wu
 */
// SPDX-License-Identifier: Apache-2.0

#include "BitMatrix.h"
#include "ReadBarcode.h"
#include "WriteBarcode.h"
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <memory>
#include <stdexcept>
#include <string>

#if defined(READER)
  #define STB_IMAGE_IMPLEMENTATION
  #include <stb_image.h>
#endif

#if defined(WRITER)
  #define STB_IMAGE_WRITE_IMPLEMENTATION
  #include <stb_image_write.h>
#endif

using namespace emscripten;

#if defined(READER) || defined(WRITER)
class JsBarcode {
private:
  std::unique_ptr<ZXing::Barcode> _barcode;
  std::string _error;

public:
  JsBarcode(std::unique_ptr<ZXing::Barcode> barcode) : _barcode(std::move(barcode)), _error("") {}

  JsBarcode(const std::string &error) : _barcode(std::make_unique<ZXing::Barcode>()), _error(std::move(error)) {}

  bool isValid() const {
    return _barcode->isValid();
  }

  std::string error() const {
    if (!_error.empty()) {
      return _error;
    }
    return ZXing::ToString(_barcode->error());
  }

  std::string format() const {
    return ZXing::ToString(_barcode->format());
  }

  val bytes() const {
    return val(typed_memory_view(_barcode->bytes().size(), _barcode->bytes().data()));
  }

  val bytesECI() const {
    return val(typed_memory_view(_barcode->bytesECI().size(), _barcode->bytesECI().data()));
  }

  std::string text(ZXing::TextMode textMode) const {
    return _barcode->text(textMode);
  }

  std::string text() const {
    return _barcode->text();
  }

  std::string ecLevel() const {
    return _barcode->ecLevel();
  }

  std::string contentType() const {
    return ZXing::ToString(_barcode->contentType());
  }

  bool hasECI() const {
    return _barcode->hasECI();
  }

  ZXing::Position position() const {
    return _barcode->position();
  }

  int orientation() const {
    return _barcode->orientation();
  }

  bool isMirrored() const {
    return _barcode->isMirrored();
  }

  bool isInverted() const {
    return _barcode->isInverted();
  }

  std::string symbologyIdentifier() const {
    return _barcode->symbologyIdentifier();
  }

  int sequenceSize() const {
    return _barcode->sequenceSize();
  }

  int sequenceIndex() const {
    return _barcode->sequenceIndex();
  }

  std::string sequenceId() const {
    return _barcode->sequenceId();
  }

  bool isLastInSequence() const {
    return _barcode->isLastInSequence();
  }

  bool isPartOfSequence() const {
    return _barcode->isPartOfSequence();
  }

  bool readerInit() const {
    return _barcode->readerInit();
  }

  int lineCount() const {
    return _barcode->lineCount();
  }

  std::string version() const {
    return _barcode->version();
  }
};

using JsBarcodes = std::vector<JsBarcode>;

#endif

#if defined(READER)

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
      jsBarcodes.push_back(JsBarcode(std::make_unique<ZXing::Barcode>(std::move(barcode))));
    }
    return jsBarcodes;
  } catch (const std::exception &e) {
    return {JsBarcode(e.what())};
  } catch (...) {
    return {JsBarcode("Unknown error")};
  }
}

JsBarcodes readBarcodesFromImage(int bufferPtr, int bufferLength, const JsReaderOptions &jsReaderOptions) {
  int width, height, channels;
  std::unique_ptr<stbi_uc, void (*)(void *)> buffer(
    stbi_load_from_memory(reinterpret_cast<const stbi_uc *>(bufferPtr), bufferLength, &width, &height, &channels, 1), stbi_image_free
  );
  if (!buffer) {
    return {JsBarcode("Failed to load image from memory")};
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

std::string WriteBarcodeFromTextToSVG(std::string text, const JsWriterOptions &jsWriterOptions) {
  ZXing::WriteBarcodeToSVG(
    ZXing::CreateBarcodeFromText(
      text,
      ZXing::CreatorOptions()
        .setFormat(ZXing::BarcodeFormatFromString(jsWriterOptions.format))
        .setReaderInit(jsWriterOptions.readerInit)
        .setForceSquareDataMatrix(jsWriterOptions.forceSquareDataMatrix)
        .setEcLevel(jsWriterOptions.ecLevel)
    ),
    ZXing::WriterOptions()
      .setScale(jsWriterOptions.scale)
      .setSizeHint(jsWriterOptions.sizeHint)
      .setRotate(jsWriterOptions.rotate)
      .setWithHRT(jsWriterOptions.withHRT)
      .setWithQuietZones(jsWriterOptions.withQuietZones)
  );
}

std::string WriteBarcodeFromBytesToSVG(int bufferPtr, int bufferLength, const JsWriterOptions &jsWriterOptions) {
  ZXing::WriteBarcodeToSVG(
    ZXing::CreateBarcodeFromBytes(
      reinterpret_cast<const void *>(bufferPtr),
      bufferLength,
      ZXing::CreatorOptions()
        .setFormat(ZXing::BarcodeFormatFromString(jsWriterOptions.format))
        .setReaderInit(jsWriterOptions.readerInit)
        .setForceSquareDataMatrix(jsWriterOptions.forceSquareDataMatrix)
        .setEcLevel(jsWriterOptions.ecLevel)
    ),
    ZXing::WriterOptions()
      .setScale(jsWriterOptions.scale)
      .setSizeHint(jsWriterOptions.sizeHint)
      .setRotate(jsWriterOptions.rotate)
      .setWithHRT(jsWriterOptions.withHRT)
      .setWithQuietZones(jsWriterOptions.withQuietZones)
  );
}

std::string WriteBarcodesFromTextToUtf8(std::string text, const JsWriterOptions &jsWriterOptions) {
  return ZXing::WriteBarcodeToUtf8(
    ZXing::CreateBarcodeFromText(
      text,
      ZXing::CreatorOptions()
        .setFormat(ZXing::BarcodeFormatFromString(jsWriterOptions.format))
        .setReaderInit(jsWriterOptions.readerInit)
        .setForceSquareDataMatrix(jsWriterOptions.forceSquareDataMatrix)
        .setEcLevel(jsWriterOptions.ecLevel)
    ),
    ZXing::WriterOptions()
      .setScale(jsWriterOptions.scale)
      .setSizeHint(jsWriterOptions.sizeHint)
      .setRotate(jsWriterOptions.rotate)
      .setWithHRT(jsWriterOptions.withHRT)
      .setWithQuietZones(jsWriterOptions.withQuietZones)
  );
}

std::string WriteBarcodesFromBytesToUtf8(int bufferPtr, int bufferLength, const JsWriterOptions &jsWriterOptions) {
  return ZXing::WriteBarcodeToUtf8(
    ZXing::CreateBarcodeFromBytes(
      reinterpret_cast<const void *>(bufferPtr),
      bufferLength,
      ZXing::CreatorOptions()
        .setFormat(ZXing::BarcodeFormatFromString(jsWriterOptions.format))
        .setReaderInit(jsWriterOptions.readerInit)
        .setForceSquareDataMatrix(jsWriterOptions.forceSquareDataMatrix)
        .setEcLevel(jsWriterOptions.ecLevel)
    ),
    ZXing::WriterOptions()
      .setScale(jsWriterOptions.scale)
      .setSizeHint(jsWriterOptions.sizeHint)
      .setRotate(jsWriterOptions.rotate)
      .setWithHRT(jsWriterOptions.withHRT)
      .setWithQuietZones(jsWriterOptions.withQuietZones)
  );
}

val WriteBarcodeFromTextToImage(std::string text, const JsWriterOptions &jsWriterOptions) {
  auto result = ZXing::WriteBarcodeToImage(
    ZXing::CreateBarcodeFromText(
      text,
      ZXing::CreatorOptions()
        .setFormat(ZXing::BarcodeFormatFromString(jsWriterOptions.format))
        .setReaderInit(jsWriterOptions.readerInit)
        .setForceSquareDataMatrix(jsWriterOptions.forceSquareDataMatrix)
        .setEcLevel(jsWriterOptions.ecLevel)
    ),
    ZXing::WriterOptions()
      .setScale(jsWriterOptions.scale)
      .setSizeHint(jsWriterOptions.sizeHint)
      .setRotate(jsWriterOptions.rotate)
      .setWithHRT(jsWriterOptions.withHRT)
      .setWithQuietZones(jsWriterOptions.withQuietZones)
  );
}

#endif

EMSCRIPTEN_BINDINGS(ZXingWasm) {

#if defined(READER)

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

  value_object<JsWriteResult>("WriteResult").field("image", &JsWriteResult::image).field("error", &JsWriteResult::error);

  function("writeBarcodeToImage", &writeBarcodeToImage);

#endif

#if defined(READER) || defined(WRITER)

  value_object<ZXing::PointI>("Point").field("x", &ZXing::PointI::x).field("y", &ZXing::PointI::y);

  value_object<ZXing::Position>("Position")
    .field("topLeft", emscripten::index<0>())
    .field("topRight", emscripten::index<1>())
    .field("bottomRight", emscripten::index<2>())
    .field("bottomLeft", emscripten::index<3>());

  class_<JsBarcode>("Barcode")
    .smart_ptr<std::shared_ptr<JsBarcode>>("shared_ptr<JsBarcode>")
    .property("isValid", &JsBarcode::isValid)
    .property("error", &JsBarcode::error)
    .property("format", &JsBarcode::format)
    .property("bytes", &JsBarcode::bytes)
    .property("bytesECI", &JsBarcode::bytesECI)
    .function("text", select_overload<std::string(ZXing::TextMode) const>(&JsBarcode::text))
    .property("text", select_overload<std::string() const>(&JsBarcode::text))
    .property("ecLevel", &JsBarcode::ecLevel)
    .property("contentType", &JsBarcode::contentType)
    .property("hasECI", &JsBarcode::hasECI)
    .property("position", &JsBarcode::position, return_value_policy::reference())
    .property("orientation", &JsBarcode::orientation)
    .property("isMirrored", &JsBarcode::isMirrored)
    .property("isInverted", &JsBarcode::isInverted)
    .property("symbologyIdentifier", &JsBarcode::symbologyIdentifier)
    .property("sequenceSize", &JsBarcode::sequenceSize)
    .property("sequenceIndex", &JsBarcode::sequenceIndex)
    .property("sequenceId", &JsBarcode::sequenceId)
    .property("isLastInSequence", &JsBarcode::isLastInSequence)
    .property("isPartOfSequence", &JsBarcode::isPartOfSequence)
    .property("readerInit", &JsBarcode::readerInit)
    .property("lineCount", &JsBarcode::lineCount)
    .property("version", &JsBarcode::version);

  register_vector<JsBarcode>("Barcodes");

#endif
};
