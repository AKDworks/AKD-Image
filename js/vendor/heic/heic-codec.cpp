#include <algorithm>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#include <libheif/heif.h>

namespace {

std::string last_error;

int fail(const char* fallback, const heif_error& error) {
  last_error = error.message && error.message[0] ? error.message : fallback;
  return error.code ? static_cast<int>(error.code) : -1;
}

heif_error write_bytes(heif_context*, const void* data, size_t size, void* userdata) {
  auto* output = static_cast<std::vector<uint8_t>*>(userdata);
  const auto* begin = static_cast<const uint8_t*>(data);
  output->insert(output->end(), begin, begin + size);
  return {heif_error_Ok, heif_suberror_Unspecified, "Success"};
}

}  // namespace

extern "C" {

const char* akd_heic_last_error() {
  return last_error.c_str();
}

void akd_heic_free(void* pointer) {
  std::free(pointer);
}

int akd_heic_decode(const uint8_t* input, size_t input_size,
                    uint8_t** output, int* width, int* height) {
  last_error.clear();
  if (!input || !input_size || !output || !width || !height) {
    last_error = "Invalid HEIC input";
    return -1;
  }

  heif_context* context = heif_context_alloc();
  if (!context) {
    last_error = "Unable to allocate HEIC decoder";
    return -1;
  }

  heif_error error = heif_context_read_from_memory_without_copy(
      context, input, input_size, nullptr);
  if (error.code != heif_error_Ok) {
    heif_context_free(context);
    return fail("Unable to read HEIC file", error);
  }

  heif_image_handle* handle = nullptr;
  error = heif_context_get_primary_image_handle(context, &handle);
  if (error.code != heif_error_Ok) {
    heif_context_free(context);
    return fail("Unable to read primary HEIC image", error);
  }

  *width = heif_image_handle_get_width(handle);
  *height = heif_image_handle_get_height(handle);

  heif_image* image = nullptr;
  error = heif_decode_image(handle, &image, heif_colorspace_RGB,
                            heif_chroma_interleaved_RGBA, nullptr);
  if (error.code != heif_error_Ok) {
    heif_image_handle_release(handle);
    heif_context_free(context);
    return fail("Unable to decode HEIC pixels", error);
  }

  int stride = 0;
  const uint8_t* plane = heif_image_get_plane_readonly(
      image, heif_channel_interleaved, &stride);
  const size_t row_size = static_cast<size_t>(*width) * 4;
  const size_t output_size = row_size * static_cast<size_t>(*height);
  auto* pixels = static_cast<uint8_t*>(std::malloc(output_size));
  if (!pixels || !plane) {
    std::free(pixels);
    heif_image_release(image);
    heif_image_handle_release(handle);
    heif_context_free(context);
    last_error = "Unable to allocate decoded HEIC pixels";
    return -1;
  }

  for (int y = 0; y < *height; ++y) {
    std::memcpy(pixels + static_cast<size_t>(y) * row_size,
                plane + static_cast<size_t>(y) * stride, row_size);
  }

  *output = pixels;
  heif_image_release(image);
  heif_image_handle_release(handle);
  heif_context_free(context);
  return 0;
}

int akd_heic_encode(const uint8_t* rgba, int width, int height, int quality,
                    uint8_t** output, size_t* output_size) {
  last_error.clear();
  if (!rgba || width <= 0 || height <= 0 || !output || !output_size) {
    last_error = "Invalid image data for HEIC encoding";
    return -1;
  }

  heif_context* context = heif_context_alloc();
  heif_image* image = nullptr;
  heif_encoder* encoder = nullptr;

  heif_error error = heif_image_create(width, height, heif_colorspace_RGB,
                                       heif_chroma_interleaved_RGB, &image);
  if (error.code != heif_error_Ok) {
    heif_context_free(context);
    return fail("Unable to create HEIC image", error);
  }

  error = heif_image_add_plane(image, heif_channel_interleaved,
                               width, height, 8);
  if (error.code != heif_error_Ok) {
    heif_image_release(image);
    heif_context_free(context);
    return fail("Unable to allocate HEIC image plane", error);
  }

  int stride = 0;
  uint8_t* plane = heif_image_get_plane(image, heif_channel_interleaved, &stride);
  const size_t source_row_size = static_cast<size_t>(width) * 4;
  for (int y = 0; y < height; ++y) {
    const uint8_t* source = rgba + static_cast<size_t>(y) * source_row_size;
    uint8_t* target = plane + static_cast<size_t>(y) * stride;
    for (int x = 0; x < width; ++x) {
      const uint8_t alpha = source[x * 4 + 3];
      target[x * 3] = static_cast<uint8_t>(
          (source[x * 4] * alpha + 255 * (255 - alpha)) / 255);
      target[x * 3 + 1] = static_cast<uint8_t>(
          (source[x * 4 + 1] * alpha + 255 * (255 - alpha)) / 255);
      target[x * 3 + 2] = static_cast<uint8_t>(
          (source[x * 4 + 2] * alpha + 255 * (255 - alpha)) / 255);
    }
  }

  error = heif_context_get_encoder_for_format(
      context, heif_compression_HEVC, &encoder);
  if (error.code != heif_error_Ok) {
    heif_image_release(image);
    heif_context_free(context);
    return fail("HEIC encoder is unavailable", error);
  }

  heif_encoder_set_logging_level(encoder, 0);
  error = heif_encoder_set_lossy_quality(encoder, std::clamp(quality, 1, 100));
  if (error.code == heif_error_Ok) {
    error = heif_context_encode_image(context, image, encoder, nullptr, nullptr);
  }

  std::vector<uint8_t> encoded;
  if (error.code == heif_error_Ok) {
    heif_writer writer = {1, write_bytes};
    error = heif_context_write(context, &writer, &encoded);
  }

  heif_encoder_release(encoder);
  heif_image_release(image);
  heif_context_free(context);

  if (error.code != heif_error_Ok) {
    return fail("Unable to encode HEIC image", error);
  }

  auto* bytes = static_cast<uint8_t*>(std::malloc(encoded.size()));
  if (!bytes) {
    last_error = "Unable to allocate encoded HEIC file";
    return -1;
  }
  std::memcpy(bytes, encoded.data(), encoded.size());
  *output = bytes;
  *output_size = encoded.size();
  return 0;
}

}  // extern "C"
