# AKD Image

**English** | [Русский](README.ru.md)

AKD Image is a free web service for processing static images and animated GIFs locally in your browser.

Website: [image.akdworks.com](https://image.akdworks.com/)

## About

AKD Image handles common image and animated GIF tasks without installing software or creating an account. Choose a tool, add a file, adjust the settings and download the result back to your device.

Processing is performed locally by the browser. Images and GIF animations are not uploaded to an AKD Image server.

## How to use

1. Open the website and choose a tool.
2. Drop an image into the upload area, paste it from the clipboard or select it on your device.
3. Adjust the processing settings.
4. Prepare and download the result as an individual file or a ZIP archive when batch processing is supported.

## Features

### Optimization and conversion

- image compression;
- resizing;
- conversion between JPG, PNG, WebP, AVIF, HEIC/HEIF and BMP;
- EXIF and metadata removal;
- image to Base64 conversion and restoration.

### Geometry

- cropping with presets or exact coordinates;
- rotation and mirroring;
- splitting an image into sections or a grid;
- rounded corners.

### Design and editing

- text or image watermarks;
- brightness, contrast, saturation and other effects;
- pixelation and selective area blur;
- meme creation;
- text, arrows, shapes and freehand annotations;
- collages.

### Export and additional tools

- PDF creation from one or more images;
- `favicon.ico` and PNG icon set generation;
- color palette extraction;
- batch processing with ZIP downloads.

### Animated GIF

- GIF compression and resizing;
- area and timeline trimming, rotation, mirroring and rounded corners;
- watermarks, text, shapes and annotations;
- effects, pixelation and selective blur;
- animated meme creation;
- MP4/WebM to GIF and GIF to MP4/WebM conversion;
- extraction of every GIF frame as PNG or JPG, with individual or ZIP downloads;
- GIF to Base64 or Data URL conversion and restoration without losing animation;
- frame-by-frame processing that preserves order, timing and loop settings.

## Privacy

In normal use, files remain on the user's device. The browser reads the selected images or GIF animations, processes them locally and creates the output without uploading the source files to a server.

The exception is loading a watermark logo from an external URL. In that case, the browser requests the image from the address supplied by the user.

Learn more in the [Privacy Policy](https://image.akdworks.com/privacy).

## Supported formats

Static images can be imported as JPG, PNG, WebP, AVIF, HEIC, HEIF, SVG and BMP. Export is available as JPG, PNG, WebP, AVIF, HEIC and BMP. SVG files are rasterized before editing and saved as PNG by default because Canvas cannot restore the original vector structure.

HEIC and HEIF are decoded locally through WebAssembly. HEIC export creates a standard 8-bit image; Live Photos, HDR, image sequences, depth maps and original metadata are not preserved.

Full animated GIF processing is available in compression, resizing, watermarking, cropping, timeline trimming, rotation, effects, meme generation, rounded corners, pixelation, Base64 conversion, selective blur and image annotation.

GIF changes are applied to every frame. The result preserves frame order, duration and loop settings. Static output formats are disabled for animated results to prevent accidental loss of animation.

Tools without complete frame-by-frame processing do not list GIF as a supported format and do not accept GIF files.

Depending on the tool, output may also be produced as PDF, ZIP, Base64, Data URL or a favicon file set.

The Video ↔ GIF tool accepts MP4 and WebM video for GIF creation and converts GIF to MP4 or WebM. Processing runs locally through FFmpeg WebAssembly. On first use, the browser downloads an approximately 31 MB module from AKD Image, which may then be reused from the browser cache.

When exporting to JPG, transparent areas receive a white background. PNG, WebP and AVIF can preserve transparency.

## Interface

- automatic browser-language detection with English and Russian interfaces;
- manual language switching with the preference stored locally;
- light, dark and system themes;
- responsive desktop and mobile layouts;
- clipboard image paste;
- category filters and tool sorting;
- a local favorites list for quick access;
- short page URLs;
- no registration;
- background processing for large images in supported browsers;
- clear processing states and result previews.

## Compatibility and limits

AKD Image targets current versions of Chrome, Edge, Firefox and Safari. Processing speed depends on device performance, available memory, file size and image resolution.

General limits:

- up to 50 MB per static image;
- up to 50 files and 250 MB per upload;
- up to 40 megapixels and 16,384 pixels on either side;
- up to 500 MB of source data when creating a ZIP archive.

HEIC and HEIF limits:

- up to 20 MB per source file;
- up to 20 megapixels and 8,192 pixels on either side for HEIC export;
- one static 8-bit frame without extended container data.

BMP export is limited to 20 megapixels. BMP and HEIC do not support transparency in AKD Image, so transparent areas receive a white background.

Animated GIF limits:

- up to 25 MB per file;
- up to 200 frames and 60 seconds;
- up to 1,920 pixels on either side and 2.1 megapixels per frame;
- up to 24 million pixels across all frames;
- at least 30 ms per frame;
- up to 50 MB for the output GIF.

Base64 conversion is limited to 3 MB of source data in either direction. This prevents the browser from becoming unresponsive while handling very long strings. Compress or resize larger images first.

Video ↔ GIF limits:

- one file per operation;
- video up to 100 MB and GIF up to 25 MB;
- up to 60 seconds;
- MP4 and WebM video input;
- MP4 and WebM video output;
- processing speed depends on the device, and the tab must remain open until conversion finishes.

## Source code and license

The repository is published for review, study and educational reference. This is not an open-source project and does not use a permissive software license.

Using the website and using its source code are separate matters:

- the tools on the website are free to use;
- code or design may not be copied into other projects without written permission;
- the AKD Image interface may not be reproduced;
- modified copies may not be distributed;
- the project or its parts may not be presented as someone else's work;
- these restrictions apply to both commercial and non-commercial use of the code.

All rights to the original AKD Image code, interface, design and documentation belong to AKDworks. See [LICENSE](LICENSE) for the complete terms.

Third-party components in `js/vendor` and `fonts` remain under their respective licenses. HEIC/HEIF support uses libheif, libde265 and Kvazaar compiled to WebAssembly without x265. Video and GIF conversion uses ffmpeg.wasm and the FFmpeg WebAssembly core. Versions, authors, official sources and license details are listed on the [Licenses and components](https://image.akdworks.com/licenses) page, and full license texts are stored next to the relevant files. These licenses apply only to third-party components and do not change the terms for AKD Image itself.

## Security

Do not publish vulnerability details in public Issues before a fix is available. Follow [SECURITY.md](SECURITY.md) to submit a private report.

## Author

Developed by [AKDworks](https://github.com/AKDworks).

© 2026 AKDworks. All rights reserved.
