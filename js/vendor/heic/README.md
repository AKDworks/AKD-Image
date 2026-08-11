# HEIC/HEIF codec

The browser codec is compiled to WebAssembly from:

- libheif 1.23.1 (LGPL-3.0-or-later)
- libde265 1.0.16 (LGPL-3.0-or-later)
- Kvazaar 2.3.2 (BSD-3-Clause)

The build intentionally excludes x265 and every other GPL codec. The generated
WebAssembly module supports decoding and encoding still 8-bit HEIC/HEIF images.
The wrapper source is included so the module can be rebuilt or replaced.

The Emscripten build uses an 8 MB WebAssembly stack because Kvazaar's frame
analysis exceeds the default 64 KB stack even for small images.
It is compiled with `DYNAMIC_EXECUTION=0`, so the loader works with the site's
Content Security Policy without enabling `unsafe-eval`.

Upstream sources:

- https://github.com/strukturag/libheif
- https://github.com/strukturag/libde265
- https://github.com/ultravideo/kvazaar
