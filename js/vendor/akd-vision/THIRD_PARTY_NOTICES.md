# Third-party notices

AKD Vision is original software by AKDworks. It depends on the following third-party components. Their licenses apply to those components only, not to the AKD Vision source code.

## @huggingface/transformers

- Project: https://github.com/huggingface/transformers.js
- License: Apache License 2.0

Transformers.js runs ONNX models in the browser through ONNX Runtime Web. It is used as the inference runtime. User images are processed locally and are not sent to Hugging Face.

## ONNX Runtime Web

- Project: https://github.com/microsoft/onnxruntime
- License: MIT

Used transitively by Transformers.js for WebGPU and WASM inference.

## BiRefNet Lite

- Weights: https://huggingface.co/studioludens/birefnet-lite-512
- Base model: https://huggingface.co/ZhengPeng7/BiRefNet_lite
- License: MIT

Default background-removal / object-matting model. The weights are downloaded to the user's browser (or served from a host you control) and executed on-device.

Please cite the original paper if you use this model in research:

```
@article{zheng2024birefnet,
  title={Bilateral Reference for High-Resolution Dichotomous Image Segmentation},
  author={Zheng, Peng and Gao, Dehong and Fan, Deng-Ping and Liu, Li and Laaksonen, Jorma and Ouyang, Wanli and Sebe, Nicu},
  journal={CAAI Artificial Intelligence Research},
  year={2024}
}
```
