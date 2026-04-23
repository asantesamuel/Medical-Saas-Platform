# backend/scripts/create_placeholder_models.py
import numpy as np
import tensorflow as tf
import os

os.makedirs("models", exist_ok=True)

def make_model(num_classes: int, path: str):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 3)),
        tf.keras.layers.Conv2D(8, 3, activation="relu", padding="same"),
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])
    model.save(path)
    print(f"Saved placeholder → {path}")

make_model(4, "models/brain_tumor_model.h5")   # 4 classes: No Tumor, Glioma, Meningioma, Pituitary
make_model(2, "models/stroke_model.h5")         # 2 classes: Normal, Ischemic Stroke