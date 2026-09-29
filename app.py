from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import joblib

app = Flask(__name__)

# Load model pipeline
model = joblib.load("best_titanic_pipeline.pkl")

feature_cols = [
    "Pclass",
    "Sex",
    "Age",
    "Embarked",
    "FamilySize",
    "TitleGroup",
    "AgeGroup",
    "FareGroup",
    "Deck",
    "FarePerPerson_Log",
    "Age_Class"
]


def get_age_group(age):
    if age <= 3:
        return "Infant"
    elif age <= 12:
        return "Child"
    elif age <= 18:
        return "Teenager"
    elif age <= 35:
        return "Young Adult"
    elif age <= 50:
        return "Adult"
    elif age <= 65:
        return "Middle-aged"
    else:
        return "Senior"


def get_fare_group(fare_per_person):
    if fare_per_person <= 10:
        return "Low"
    elif fare_per_person <= 20:
        return "Medium"
    elif fare_per_person <= 40:
        return "High"
    else:
        return "Very High"


def process_input(data):
    pclass = int(data["pclass"])
    sex = str(data["sex"]).strip().lower()
    age = float(data["age"])
    fare = float(data["fare"])
    family_size = int(data["familySize"])
    embarked = str(data["embarked"]).strip().upper()
    title_group = str(data["titleGroup"]).strip()
    deck = str(data["deck"]).strip().upper()

    fare_per_person = fare / family_size if family_size > 0 else fare
    fare_per_person_log = np.log1p(fare_per_person)
    age_class = age * pclass

    age_group = get_age_group(age)
    fare_group = get_fare_group(fare_per_person)

    df_input = pd.DataFrame([{
        "Pclass": pclass,
        "Sex": sex,
        "Age": age,
        "Embarked": embarked,
        "FamilySize": family_size,
        "TitleGroup": title_group,
        "AgeGroup": age_group,
        "FareGroup": fare_group,
        "Deck": deck,
        "FarePerPerson_Log": fare_per_person_log,
        "Age_Class": age_class
    }])

    df_input = df_input.reindex(columns=feature_cols)

    category_names = [
        "Sex",
        "Embarked",
        "TitleGroup",
        "AgeGroup",
        "FareGroup",
        "Deck"
    ]

    for col in category_names:
        if col in df_input.columns:
            df_input[col] = df_input[col].astype("category")

    return df_input, fare_per_person, age_group, fare_group


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        X_pred, fare_per_person, age_group, fare_group = process_input(data)

        print("\n===== DEBUG INPUT FROM FRONTEND =====")
        print(data)
        print("\n===== X_pred =====")
        print(X_pred)
        print("\n===== X_pred dtypes =====")
        print(X_pred.dtypes)

        pred = int(model.predict(X_pred)[0])

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_pred)[0]
            classes = model.named_steps["model"].classes_

            survived_index = list(classes).index(1)
            died_index = list(classes).index(0)

            prob_survived = float(proba[survived_index])
            prob_died = float(proba[died_index])
        else:
            prob_survived = None
            prob_died = None

        result = "Survived" if pred == 1 else "Died"

        return jsonify({
            "status": "success",
            "prediction": result,
            "prob_survived": round(prob_survived * 100, 2),
            "prob_died": round(prob_died * 100, 2),
            "fare_per_person": round(fare_per_person, 2),
            "age_group": age_group,
            "fare_group": fare_group
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        })


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)