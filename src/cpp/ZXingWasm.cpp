/*
 * Copyright 2016 Nu-book Inc.
 * Copyright 2023 Axel Waggershauser
 * Copyright 2023 Ze-Zheng Wu
 */
// SPDX-License-Identifier: Apache-2.0

#include "BitMatrix.h"
#include "MultiFormatWriter.h"
#include "ReadBarcode.h"
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

#if defined(READER)

struct JsDecodeHints {
  std::string formats;
  bool tryHarder;
  bool tryRotate;
  bool tryInvert;
  bool tryDownscale;
  ZXing::Binarizer binarizer;
  bool isPure;
  uint16_t downscaleThreshold;
  uint8_t downscaleFactor;
  uint8_t minLineCount;
  uint8_t maxNumberOfSymbols;
  bool tryCode39ExtendedMode;
  bool validateCode39CheckSum;
  bool validateITFCheckSum;
  bool returnCodabarStartEnd;
  bool returnErrors;
  ZXing::EanAddOnSymbol eanAddOnSymbol;
  ZXing::TextMode textMode;
  ZXing::CharacterSet characterSet;
};

struct JsReadResult {
  bool isValid;
  std::string error;
  std::string format;
  emscripten::val bytes;
  emscripten::val bytesECI;
  std::string text;
  std::string eccLevel;
  ZXing::ContentType contentType;
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
};

using JsResults = std::vector<JsReadResult>;

JsResults readBarcodes(
  ZXing::ImageView imageView, const JsDecodeHints &jsDecodeHints
) {
  try {

    ZXing::DecodeHints decodeHints;
    decodeHints.setFormats(ZXing::BarcodeFormatsFromString(jsDecodeHints.formats
    ));
    decodeHints.setTryHarder(jsDecodeHints.tryHarder);
    decodeHints.setTryRotate(jsDecodeHints.tryRotate);
    decodeHints.setTryInvert(jsDecodeHints.tryInvert);
    decodeHints.setTryDownscale(jsDecodeHints.tryDownscale);
    decodeHints.setBinarizer(jsDecodeHints.binarizer);
    decodeHints.setIsPure(jsDecodeHints.isPure);
    decodeHints.setDownscaleThreshold(jsDecodeHints.downscaleThreshold);
    decodeHints.setDownscaleFactor(jsDecodeHints.downscaleFactor);
    decodeHints.setMinLineCount(jsDecodeHints.minLineCount);
    decodeHints.setMaxNumberOfSymbols(jsDecodeHints.maxNumberOfSymbols);
    decodeHints.setTryCode39ExtendedMode(jsDecodeHints.tryCode39ExtendedMode);
    decodeHints.setValidateCode39CheckSum(jsDecodeHints.validateCode39CheckSum);
    decodeHints.setValidateITFCheckSum(jsDecodeHints.validateITFCheckSum);
    decodeHints.setReturnCodabarStartEnd(jsDecodeHints.returnCodabarStartEnd);
    decodeHints.setReturnErrors(jsDecodeHints.returnErrors);
    decodeHints.setEanAddOnSymbol(jsDecodeHints.eanAddOnSymbol);
    decodeHints.setTextMode(jsDecodeHints.textMode);
    decodeHints.setCharacterSet(jsDecodeHints.characterSet);

    auto results = ZXing::ReadBarcodes(imageView, decodeHints);

    thread_local const val Uint8Array = val::global("Uint8Array");

    JsResults jsResults(results.size());

    for (auto &result : results) {
      const ZXing::ByteArray &bytes = result.bytes();
      const ZXing::ByteArray &bytesECI = result.bytesECI();
      jsResults.push_back(
        {.isValid = result.isValid(),
         .error = ZXing::ToString(result.error()),
         .format = ZXing::ToString(result.format()),
         .bytes = std::move(
           Uint8Array.new_(typed_memory_view(bytes.size(), bytes.data()))
         ),
         .bytesECI = std::move(
           Uint8Array.new_(typed_memory_view(bytesECI.size(), bytesECI.data()))
         ),
         .text = result.text(),
         .eccLevel = result.ecLevel(),
         .contentType = result.contentType(),
         .hasECI = result.hasECI(),
         .position = result.position(),
         .orientation = result.orientation(),
         .isMirrored = result.isMirrored(),
         .isInverted = result.isInverted(),
         .symbologyIdentifier = result.symbologyIdentifier(),
         .sequenceSize = result.sequenceSize(),
         .sequenceIndex = result.sequenceIndex(),
         .sequenceId = result.sequenceId(),
         .readerInit = result.readerInit(),
         .lineCount = result.lineCount(),
         .version = result.version()}
      );
    }
    return jsResults;
  } catch (const std::exception &e) {
    return {{.error = e.what()}};
  } catch (...) {
    return {{.error = "Unknown error"}};
  }
  return {};
}

JsResults readBarcodesFromImage(
  int bufferPtr, int bufferLength, const JsDecodeHints &jsDecodeHints
) {
  int width, height, channels;
  std::unique_ptr<stbi_uc, void (*)(void *)> buffer(
    stbi_load_from_memory(
      reinterpret_cast<const unsigned char *>(bufferPtr),
      bufferLength,
      &width,
      &height,
      &channels,
      1
    ),
    stbi_image_free
  );
  if (buffer == nullptr) {
    return {};
  }
  return readBarcodes(
    {buffer.get(), width, height, ZXing::ImageFormat::Lum}, jsDecodeHints
  );
}

JsResults readBarcodesFromPixmap(
  int bufferPtr, int imgWidth, int imgHeight, const JsDecodeHints &jsDecodeHints
) {
  return readBarcodes(
    {reinterpret_cast<uint8_t *>(bufferPtr),
     imgWidth,
     imgHeight,
     ZXing::ImageFormat::RGBX},
    jsDecodeHints
  );
}

#endif

#if defined(WRITER)

struct JsEncodeHints {
  int width;
  int height;
  std::string format;
  ZXing::CharacterSet characterSet;
  int eccLevel;
  int margin;
};

struct JsWriteResult {
  emscripten::val image;
  std::string error;
};

JsWriteResult writeBarcodeToImage(
  std::wstring text, const JsEncodeHints &jsEncodeHints
) {
  try {
    auto format = ZXing::BarcodeFormatFromString(jsEncodeHints.format);
    if (format == ZXing::BarcodeFormat::None) {
      return {.error = "Unsupported format: " + jsEncodeHints.format};
    }

    ZXing::MultiFormatWriter writer(format);

    auto margin = jsEncodeHints.margin;
    if (margin >= 0) {
      writer.setMargin(margin);
    }

    auto characterSet = jsEncodeHints.characterSet;
    if (characterSet != ZXing::CharacterSet::Unknown) {
      writer.setEncoding(characterSet);
    }

    auto eccLevel = jsEncodeHints.eccLevel;
    if (eccLevel >= 0 && eccLevel <= 8) {
      writer.setEccLevel(eccLevel);
    }

    auto buffer = ZXing::ToMatrix<uint8_t>(
      writer.encode(text, jsEncodeHints.width, jsEncodeHints.height)
    );

    int len;
    uint8_t *bytes = stbi_write_png_to_mem(
      buffer.data(), 0, buffer.width(), buffer.height(), 1, &len
    );

    if (bytes == nullptr) {
      return {.error = "Unknown error"};
    };

    thread_local const val Uint8Array = val::global("Uint8Array");

    val js_bytes = Uint8Array.new_(typed_memory_view(len, bytes));
    STBIW_FREE(bytes);

    return {.image = js_bytes};

  } catch (const std::exception &e) {
    return {.error = e.what()};
  } catch (...) {
    return {.error = "Unknown error"};
  }
}

#endif

EMSCRIPTEN_BINDINGS(ZXingWasm) {

#if defined(READER)

  enum_<ZXing::Binarizer>("Binarizer")
    .value("LocalAverage", ZXing::Binarizer::LocalAverage)
    .value("GlobalHistogram", ZXing::Binarizer::GlobalHistogram)
    .value("FixedThreshold", ZXing::Binarizer::FixedThreshold)
    .value("BoolCast", ZXing::Binarizer::BoolCast);

  enum_<ZXing::EanAddOnSymbol>("EanAddOnSymbol")
    .value("Ignore", ZXing::EanAddOnSymbol::Ignore)
    .value("Read", ZXing::EanAddOnSymbol::Read)
    .value("Require", ZXing::EanAddOnSymbol::Require);

  enum_<ZXing::TextMode>("TextMode")
    .value("Plain", ZXing::TextMode::Plain)
    .value("ECI", ZXing::TextMode::ECI)
    .value("HRI", ZXing::TextMode::HRI)
    .value("Hex", ZXing::TextMode::Hex)
    .value("Escaped", ZXing::TextMode::Escaped);

  enum_<ZXing::ContentType>("ContentType")
    .value("Text", ZXing::ContentType::Text)
    .value("Binary", ZXing::ContentType::Binary)
    .value("Mixed", ZXing::ContentType::Mixed)
    .value("GS1", ZXing::ContentType::GS1)
    .value("ISO15434", ZXing::ContentType::ISO15434)
    .value("UnknownECI", ZXing::ContentType::UnknownECI);

  value_object<ZXing::PointI>("Point")
    .field("x", &ZXing::PointI::x)
    .field("y", &ZXing::PointI::y);

  value_object<ZXing::Position>("Position")
    .field("topLeft", emscripten::index<0>())
    .field("topRight", emscripten::index<1>())
    .field("bottomRight", emscripten::index<2>())
    .field("bottomLeft", emscripten::index<3>());

  value_object<JsDecodeHints>("DecodeHints")
    .field("formats", &JsDecodeHints::formats)
    .field("tryHarder", &JsDecodeHints::tryHarder)
    .field("tryRotate", &JsDecodeHints::tryRotate)
    .field("tryInvert", &JsDecodeHints::tryInvert)
    .field("tryDownscale", &JsDecodeHints::tryDownscale)
    .field("binarizer", &JsDecodeHints::binarizer)
    .field("isPure", &JsDecodeHints::isPure)
    .field("downscaleThreshold", &JsDecodeHints::downscaleThreshold)
    .field("downscaleFactor", &JsDecodeHints::downscaleFactor)
    .field("minLineCount", &JsDecodeHints::minLineCount)
    .field("maxNumberOfSymbols", &JsDecodeHints::maxNumberOfSymbols)
    .field("tryCode39ExtendedMode", &JsDecodeHints::tryCode39ExtendedMode)
    .field("validateCode39CheckSum", &JsDecodeHints::validateCode39CheckSum)
    .field("validateITFCheckSum", &JsDecodeHints::validateITFCheckSum)
    .field("returnCodabarStartEnd", &JsDecodeHints::returnCodabarStartEnd)
    .field("returnErrors", &JsDecodeHints::returnErrors)
    .field("eanAddOnSymbol", &JsDecodeHints::eanAddOnSymbol)
    .field("textMode", &JsDecodeHints::textMode)
    .field("characterSet", &JsDecodeHints::characterSet);

  value_object<JsReadResult>("ReadResult")
    .field("isValid", &JsReadResult::isValid)
    .field("error", &JsReadResult::error)
    .field("format", &JsReadResult::format)
    .field("bytes", &JsReadResult::bytes)
    .field("bytesECI", &JsReadResult::bytesECI)
    .field("text", &JsReadResult::text)
    .field("eccLevel", &JsReadResult::eccLevel)
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
    .field("version", &JsReadResult::version);

  register_vector<JsReadResult>("ReadResults");

  function("readBarcodesFromImage", &readBarcodesFromImage);
  function("readBarcodesFromPixmap", &readBarcodesFromPixmap);

#endif

#if defined(WRITER)

  value_object<JsEncodeHints>("EncodeHints")
    .field("width", &JsEncodeHints::width)
    .field("height", &JsEncodeHints::height)
    .field("format", &JsEncodeHints::format)
    .field("characterSet", &JsEncodeHints::characterSet)
    .field("eccLevel", &JsEncodeHints::eccLevel)
    .field("margin", &JsEncodeHints::margin);

  value_object<JsWriteResult>("WriteResult")
    .field("image", &JsWriteResult::image)
    .field("error", &JsWriteResult::error);

  function("writeBarcodeToImage", &writeBarcodeToImage);

#endif

  enum_<ZXing::CharacterSet>("CharacterSet")
    .value("Unknown", ZXing::CharacterSet::Unknown)
    .value("ASCII", ZXing::CharacterSet::ASCII)
    .value("ISO8859_1", ZXing::CharacterSet::ISO8859_1)
    .value("ISO8859_2", ZXing::CharacterSet::ISO8859_2)
    .value("ISO8859_3", ZXing::CharacterSet::ISO8859_3)
    .value("ISO8859_4", ZXing::CharacterSet::ISO8859_4)
    .value("ISO8859_5", ZXing::CharacterSet::ISO8859_5)
    .value("ISO8859_6", ZXing::CharacterSet::ISO8859_6)
    .value("ISO8859_7", ZXing::CharacterSet::ISO8859_7)
    .value("ISO8859_8", ZXing::CharacterSet::ISO8859_8)
    .value("ISO8859_9", ZXing::CharacterSet::ISO8859_9)
    .value("ISO8859_10", ZXing::CharacterSet::ISO8859_10)
    .value("ISO8859_11", ZXing::CharacterSet::ISO8859_11)
    .value("ISO8859_13", ZXing::CharacterSet::ISO8859_13)
    .value("ISO8859_14", ZXing::CharacterSet::ISO8859_14)
    .value("ISO8859_15", ZXing::CharacterSet::ISO8859_15)
    .value("ISO8859_16", ZXing::CharacterSet::ISO8859_16)
    .value("Cp437", ZXing::CharacterSet::Cp437)
    .value("Cp1250", ZXing::CharacterSet::Cp1250)
    .value("Cp1251", ZXing::CharacterSet::Cp1251)
    .value("Cp1252", ZXing::CharacterSet::Cp1252)
    .value("Cp1256", ZXing::CharacterSet::Cp1256)
    .value("Shift_JIS", ZXing::CharacterSet::Shift_JIS)
    .value("Big5", ZXing::CharacterSet::Big5)
    .value("GB2312", ZXing::CharacterSet::GB2312)
    .value("GB18030", ZXing::CharacterSet::GB18030)
    .value("EUC_JP", ZXing::CharacterSet::EUC_JP)
    .value("EUC_KR", ZXing::CharacterSet::EUC_KR)
    .value("UTF16BE", ZXing::CharacterSet::UTF16BE)
    .value("UTF8", ZXing::CharacterSet::UTF8)
    .value("UTF16LE", ZXing::CharacterSet::UTF16LE)
    .value("UTF32BE", ZXing::CharacterSet::UTF32BE)
    .value("UTF32LE", ZXing::CharacterSet::UTF32LE)
    .value("BINARY", ZXing::CharacterSet::BINARY);
};
