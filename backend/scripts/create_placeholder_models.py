# Run this in a Python shell or save as a script and run it
import numpy as np
import tensorflow as tf
import os

os.makedirs("models", exist_ok=True)

def make_model(num_classes: int, path: str):
    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = tf.keras.layers.Conv2D(8, 3, activation="relu", padding="same")(inputs)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
    model = tf.keras.Model(inputs=inputs, outputs=outputs)

    # Call the model once so layer output shapes are fully defined
    dummy = np.zeros((1, 224, 224, 3), dtype="float32")
    model(dummy, training=False)

    model.save(path)
    print(f"Saved → {path}")

make_model(4, "models/brain_tumor_model.h5")
make_model(2, "models/stroke_model.h5")