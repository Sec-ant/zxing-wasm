/*
 * Copyright 2016 Nu-book Inc.
 * Copyright 2023 Axel Waggershauser
 * Copyright 2023 Ze-Zheng Wu
 */
// SPDX-License-Identifier: Apache-2.0

#include "BarcodeFormat.h"
#include "BitMatrix.h"
#include "CharacterSet.h"
#include "MultiFormatWriter.h"
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <exception>
#include <memory>
#include <string>

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include <stb_image_write.h>

using namespace emscripten;

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

EMSCRIPTEN_BINDINGS(BarcodeWriter) {
  value_object<JsEncodeHints>("JsEncodeHints")
    .field("width", &JsEncodeHints::width)
    .field("height", &JsEncodeHints::height)
    .field("format", &JsEncodeHints::format)
    .field("characterSet", &JsEncodeHints::characterSet)
    .field("eccLevel", &JsEncodeHints::eccLevel)
    .field("margin", &JsEncodeHints::margin);

  value_object<JsWriteResult>("JsWriteResult")
    .field("image", &JsWriteResult::image)
    .field("error", &JsWriteResult::error);

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

  function("writeBarcodeToImage", &writeBarcodeToImage);
}
