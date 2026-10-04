# Portfolio drawing model

The runtime is the static model and script in `site/public/scripts/`. These scripts reproduce its training and diagnostic checks; no training dependency is needed by the website.

Use Python with PyTorch, NumPy and Pillow. In one data directory, place the four original MNIST gzip files and `pendigits/pendigits-orig.tra` plus `pendigits/pendigits-orig.tes` from UCI, decompressed from the `.Z` originals. The original train/test writer split is preserved; writers 26–30 of the training set are reserved for validation.

Run `python3 scripts/drawing-model/train-cnn.py /absolute/data/directory`, then `python3 scripts/drawing-model/refine-decoder.py /absolute/data/directory`. Both stages use that directory for reports, checkpoints, parity fixtures and the exported `cnn-model.js`. Review the report and completion-quality image before copying the export to `site/public/scripts/digit-model.js`. The second stage reuses the first stage's preparation and network definition without rerunning its optimization.

The input is cropped, fitted into 20×20 pixels and centered by ink mass. The convolutional encoder has a 32-value bottleneck. The decoder receives those values and the classification probabilities derived from them. Classification is frozen during decoder refinement. Calibration uses validation images and genuine partial pen trajectories. The decoder's semantic-consistency metric uses that frozen classifier and is not an independent perceptual accuracy measurement.

The hand-drawn diagnostic suite contains ten fixed digit shapes at five sizes/positions, and is excluded from optimization. It measures known scale and position regressions rather than population handwriting accuracy. Two hooked-one cases remain ambiguous between 1 and 7; the UI displays uncertainty.

MNIST source: https://github.com/pytorch/vision/blob/main/torchvision/datasets/mnist.py

Pen trajectories: E. Alpaydin and F. Alimoglu, Pen-Based Recognition of Handwritten Digits, UCI Machine Learning Repository, https://doi.org/10.24432/C5MG6K (CC BY 4.0).
