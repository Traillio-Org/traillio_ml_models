from flask import Flask, request, jsonify
import pickle
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)

# Load the trained model
CODEFORCES_MODEL_PATH = os.path.join(BASE_DIR, "codeforces.pkl")
LEETCODE_MODEL_PATH = os.path.join(BASE_DIR, "leetcode.pkl")
STRESS_MODEL_PATH = os.path.join(BASE_DIR, "stress_calculator.pkl")
try:
    with open(CODEFORCES_MODEL_PATH, "rb") as file:
        cf_model = pickle.load(file)
except Exception as e:
    print(f"Error loading cf model: {e}")
    cf_model = None
try:
    with open(LEETCODE_MODEL_PATH, "rb") as file:
        l_model = pickle.load(file)
except Exception as e:
    print(f"Error loading l model: {e}")
    l_model = None
try:
    with open(STRESS_MODEL_PATH, "rb") as file:
        stress_model = pickle.load(file)
except Exception as e:
    print(f"Error loading stress model: {e}")
    stress_model = None


@app.route("/")
def home():
    return "Flask API is running!"


@app.route("/predict/cf", methods=["POST"])
def predictCF():
    if not cf_model:
        return jsonify({"error": "CF Model not loaded"}), 500

    try:
        # Get JSON data
        data = request.get_json()

        # Validate input
        if "features" not in data:
            return jsonify({"error": "Missing 'features' key in request"}), 400

        features = np.array(data["features"])

        # Ensure input is 2D (reshape if needed)
        if features.ndim == 1:
            features = features.reshape(1, -1)

        # Check if input size matches model expectations
        expected_features = cf_model.n_features_in_
        if features.shape[1] != expected_features:
            return (
                jsonify(
                    {
                        "error": f"Invalid input size. Expected {expected_features} features, got {features.shape[1]}"
                    }
                ),
                400,
            )

        # Make prediction
        prediction = cf_model.predict(features)

        return jsonify({"prediction": prediction.tolist()})

    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500


@app.route("/predict/leetcode", methods=["POST"])
def predictLEETCODE():
    if not l_model:
        return jsonify({"error": "leetcode Model not loaded"}), 500

    try:
        # Get JSON data
        data = request.get_json()

        # Validate input
        if "features" not in data:
            return jsonify({"error": "Missing 'features' key in request"}), 400

        features = np.array(data["features"])

        # Ensure input is 2D (reshape if needed)
        if features.ndim == 1:
            features = features.reshape(1, -1)

        # Check if input size matches model expectations
        expected_features = l_model.n_features_in_
        if features.shape[1] != expected_features:
            return (
                jsonify(
                    {
                        "error": f"Invalid input size. Expected {expected_features} features, got {features.shape[1]}"
                    }
                ),
                400,
            )

        # Make prediction
        prediction = l_model.predict(features)

        return jsonify({"prediction": prediction.tolist()})

    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500


@app.route("/predict/stress", methods=["POST"])
def predictSTRESS():
    if not stress_model:
        return jsonify({"error": "Stress Model not loaded"}), 500

    try:
        # Get JSON data
        data = request.get_json()

        # Validate input
        if "features" not in data:
            return jsonify({"error": "Missing 'features' key in request"}), 400

        features = np.array(data["features"])

        # Ensure input is 2D (reshape if needed)
        if features.ndim == 1:
            features = features.reshape(1, -1)

        # Check if input size matches model expectations
        expected_features = stress_model.n_features_in_
        if features.shape[1] != expected_features:
            return (
                jsonify(
                    {
                        "error": f"Invalid input size. Expected {expected_features} features, got {features.shape[1]}"
                    }
                ),
                400,
            )

        # Make prediction
        prediction = stress_model.predict(features)

        return jsonify({"prediction": prediction.tolist()})

    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run()
