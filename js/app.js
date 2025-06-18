const participants = new Set();
const payments = [];

function addParticipant() {
  const name = document.getElementById("participantName").value.trim();
  const message = document.getElementById("message");
  message.textContent = "";

  if (name && !participants.has(name)) {
    participants.add(name);
    updateParticipantOptions();
    message.style.color = "lightgreen";
    message.textContent = `Participant "${name}" added.`;
  } else {
    message.style.color = "red";
    message.textContent = name ? `Participant "${name}" already exists.` : "Enter a valid name.";
  }

  document.getElementById("participantName").value = "";
  setTimeout(() => { message.textContent = ""; }, 3000);
}

function updateParticipantOptions() {
  const payerSelect = document.getElementById("payerSelect");
  const customPaidFor = document.getElementById("customPaidFor");
  const currentParticipantsSpan = document.getElementById("currentParticipants");
  const totalCountSpan = document.getElementById("totalCount");

  payerSelect.innerHTML = "";
  customPaidFor.innerHTML = "";

 participants.forEach(name => {
  payerSelect.add(new Option(name, name));

  const wrapper = document.createElement("div");
  wrapper.classList.add("checkbox-row");
  wrapper.innerHTML = `
    <input type="checkbox" name="customPaidFor" value="${name}">
    <span class="participant-name">${name}</span>
  `;
  customPaidFor.appendChild(wrapper);
});


  const currentList = [...participants];
  currentParticipantsSpan.textContent = currentList.join(", ") || "None";
  totalCountSpan.textContent = currentList.length;
}

function addPayment() {
  const payer = document.getElementById("payerSelect").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const message = document.getElementById("message");

  const mode = document.querySelector('input[name="paidForMode"]:checked').value;
  let paidFor = [];

  if (mode === "everyone") {
    paidFor = [...participants];
  } else {
    paidFor = Array.from(document.querySelectorAll('input[name="customPaidFor"]:checked'))
                   .map(cb => cb.value);
  }

  if (!payer || isNaN(amount) || amount <= 0 || paidFor.length === 0) {
    message.style.color = "red";
    message.textContent = "Please fill all fields correctly.";
    return;
  }

  payments.push({ payer, amount, paidFor });

  document.getElementById("amount").value = "";
  document.querySelectorAll('input[name="customPaidFor"]').forEach(cb => cb.checked = false);
  document.querySelector('input[value="everyone"]').checked = true;

  message.style.color = "lightgreen";
  message.textContent = "Payment added successfully!";
  setTimeout(() => { message.textContent = ""; }, 3000);
}

function calculate() {
  const outputType = document.querySelector('input[name="outputType"]:checked').value;
  if (outputType === "balanced") {
    calculateBalanced();
  } else {
    calculateWhoToWhom();
  }
}

function calculateBalanced() {
  const balances = {}, owes = {};
  participants.forEach(name => {
    balances[name] = 0;
    owes[name] = 0;
  });

  payments.forEach(({ payer, amount, paidFor }) => {
    const split = amount / paidFor.length;
    paidFor.forEach(p => owes[p] += split);
    balances[payer] += amount;
  });

  const net = {};
  participants.forEach(name => {
    net[name] = +(balances[name] - owes[name]).toFixed(2);
  });

  const debtors = [], creditors = [];
  for (const [name, val] of Object.entries(net)) {
    if (val < 0) debtors.push({ name, amt: -val });
    else if (val > 0) creditors.push({ name, amt: val });
  }

  const result = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const pay = Math.min(d.amt, c.amt);
    result.push(`${d.name} pays ${c.name}: ${pay.toFixed(2)} tk`);
    d.amt -= pay;
    c.amt -= pay;
    if (d.amt < 0.01) i++;
    if (c.amt < 0.01) j++;
  }

  document.getElementById("output").textContent = result.length ? result.join("\n") : "Everyone is settled up!";
}

function calculateWhoToWhom() {
  const result = [];

  payments.forEach(({ payer, amount, paidFor }) => {
    const split = amount / paidFor.length;
    paidFor.forEach(p => {
      if (p !== payer) {
        result.push(`${p} pays ${payer}: ${split.toFixed(2)} tk`);
      }
    });
  });

  document.getElementById("output").textContent = result.length ? result.join("\n") : "No payments to show.";
}

// Handle Enter key to add participant
document.getElementById("participantName").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("addParticipantBtn").click();
  }
});

function toggleCustomPaidForState() {
  const mode = document.querySelector('input[name="paidForMode"]:checked').value;
  const customCheckboxes = document.querySelectorAll('input[name="customPaidFor"]');

  customCheckboxes.forEach(cb => {
    cb.disabled = (mode === "everyone");
    if (mode === "everyone") cb.checked = false;
  });
}

document.querySelectorAll('input[name="paidForMode"]').forEach(radio => {
  radio.addEventListener("change", toggleCustomPaidForState);
});

toggleCustomPaidForState(); // initialize checkbox state on load
