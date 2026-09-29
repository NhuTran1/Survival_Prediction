function autoSetSexByTitle() {
  const titleGroup = document.getElementById("titleGroup").value;
  const sexSelect = document.getElementById("sex");

  if (titleGroup === "Mr" || titleGroup === "Master") {
    sexSelect.value = "male";
    sexSelect.disabled = true;
  } else if (titleGroup === "Mrs" || titleGroup === "Miss") {
    sexSelect.value = "female";
    sexSelect.disabled = true;
  } else {
    // Với Dr/Rare thì không chắc chắn, cho người dùng tự chọn
    sexSelect.disabled = false;
  }
}

function checkFarePclassWarning() {
  const pclass = Number(document.getElementById("pclass").value);
  const fare = Number(document.getElementById("fare").value);
  const warningBox = document.getElementById("fareWarning");

  let warning = "";

  if (pclass === 1 && fare <= 10) {
    warning = "⚠️ Vé hạng nhất nhưng giá khá thấp so với dữ liệu Titanic. Hãy kiểm tra lại Fare.";
  } else if (pclass === 2 && fare > 75) {
    warning = "⚠️ Vé hạng hai nhưng Fare quá cao so với dữ liệu. Có thể bạn nhập nhầm.";
  } else if (pclass === 3 && fare > 70) {
    warning = "⚠️ Vé hạng ba nhưng Fare vượt mức thường thấy trong dataset. Hãy kiểm tra lại.";
  } else if (pclass === 3 && fare > 30) {
    warning = "🤔 Vé hạng ba nhưng giá khá cao. Thuyền trưởng AI hơi nghi ngờ một chút.";
  }

  warningBox.innerText = warning;
}

document.addEventListener("DOMContentLoaded", function () {
  autoSetSexByTitle();
  checkFarePclassWarning();

  document.getElementById("titleGroup").addEventListener("change", autoSetSexByTitle);
  document.getElementById("pclass").addEventListener("change", checkFarePclassWarning);
  document.getElementById("fare").addEventListener("input", checkFarePclassWarning);
});

async function predictSurvival() {
  const data = {
    titleGroup: document.getElementById("titleGroup").value,
    sex: document.getElementById("sex").value,
    age: document.getElementById("age").value,
    familySize: document.getElementById("familySize").value,
    pclass: document.getElementById("pclass").value,
    fare: document.getElementById("fare").value,
    embarked: document.getElementById("embarked").value,
    deck: document.getElementById("deck").value
  };

  const resultBox = document.getElementById("result");
  resultBox.classList.remove("hidden");
  resultBox.innerHTML = "Đang dự đoán...";

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.status === "error") {
      resultBox.innerHTML = `<p>Lỗi: ${result.message}</p>`;
      return;
    }

    const isSurvived = result.prediction === "Survived";
    const resultClass = isSurvived ? "survived" : "died";
    const resultText = isSurvived ? "SURVIVED" : "DID NOT SURVIVE";

    resultBox.innerHTML = `
      <h2 class="${resultClass}">
        ${isSurvived ? "🎉" : "🌊"} ${resultText}
      </h2>

      <p><b>Probability Survived:</b> ${result.prob_survived}%</p>
      <p><b>Probability Died:</b> ${result.prob_died}%</p>

      <hr style="margin: 14px 0; border-color: rgba(255,255,255,0.15);">

      <p><b>AgeGroup:</b> ${result.age_group}</p>
      <p><b>FareGroup:</b> ${result.fare_group}</p>
      <p><b>FarePerPerson:</b> ${result.fare_per_person}</p>
    `;

  } catch (error) {
    resultBox.innerHTML = `<p>Lỗi kết nối server: ${error.message}</p>`;
  }
}