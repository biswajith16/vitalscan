# Third-party assets

VitalScan uses `@mediapipe/tasks-vision` (Apache-2.0 according to its package
metadata). Its original WASM runtime files are copied into `public/mediapipe/wasm`
by the asset script. The face-landmark model is Google's MediaPipe Face Landmarker,
float16 version 1, downloaded from:

https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

Project and documentation: https://github.com/google-ai-edge/mediapipe

The POS algorithm is described in Wang et al., *Algorithmic Principles of Remote
PPG* (2017), DOI 10.1109/TBME.2016.2609282. VitalScan's TypeScript implementation is
written for this prototype; it is not a claim of clinical validation by the authors.

The example portrait in `tests/fixtures/portrait.jpg` comes from Google's public
MediaPipe sample assets. It is only a software test fixture and is not part of
the application's public assets. See `tests/fixtures/README.md`.

All other package licenses are in their installed package metadata and distribution
files. Original app icons and illustrations are implemented as SVG in this project.

Manrope is locally bundled through `@fontsource-variable/manrope` under the SIL
Open Font License 1.1. Its license is included in the installed package. Fonts are
served from the app, not requested from an external font service.
